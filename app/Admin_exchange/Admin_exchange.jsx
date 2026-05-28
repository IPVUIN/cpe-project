"use client";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom"; // 🌟 1. นำเข้า createPortal
import { supabase } from "@/lib/supabaseClient";
import styles from "@/app/Admin_exchange/Admin_exchange.module.css";

export default function ExchangeLog() {
  const [exchangeData, setExchangeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [activeTab, setActiveTab] = useState("Pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  // 🌟 2. เพิ่ม State เช็ค Client-side เพื่อให้ใช้ createPortal ใน Next.js ได้โดยไม่ Error
  const [isMounted, setIsMounted] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    storeName: "",
    requestAmount: 0,
    walletBalance: 0,
  });

  useEffect(() => {
    setIsMounted(true); // เซ็ตค่าว่าคอมโพเนนต์โหลดเสร็จแล้ว
    fetchData();

    const channel = supabase
      .channel('realtime-exchange-log')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exchange_request' },
        (payload) => { fetchData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      setUser(profile);
    }
    loadUser();
  }, []);

  async function fetchData() {
    if (exchangeData.length === 0) setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("exchange_request")
        .select(`
          id, store_id, bank_id, bank_number, name, status, amount, slip_url, created_at,
          bank ( name ), 
          stores ( name, users ( id ) )
        `)
        .order("id", { ascending: false });

      if (error) throw error;
      setExchangeData(data || []);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const stats = useMemo(() => {
    return {
      pending: exchangeData.filter((l) => (l.status || "").toLowerCase() === "pending").length,
      approved: exchangeData.filter((l) => (l.status || "").toLowerCase() === "approved").length,
      rejected: exchangeData.filter((l) => (l.status || "").toLowerCase() === "rejected").length,
      total: exchangeData.length,
    };
  }, [exchangeData]);

  const handleActionClick = async (id, newStatus) => {
    const targetLog = exchangeData.find(l => l.id === id);
    if (targetLog.status !== 'pending') {
      alert("รายการนี้ถูกดำเนินการไปแล้ว ไม่สามารถแก้ไขได้");
      return;
    }

    const userId = targetLog.stores?.users?.id;
    let balance = 0;

    if (userId) {
      try {
        const { data: walletData } = await supabase
          .from("wallet")
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle();

        if (walletData) balance = walletData.balance;
      } catch (e) {
        console.error("Fetch wallet error:", e);
      }
    }

    setConfirmDialog({ 
      isOpen: true, 
      id, 
      newStatus,
      storeName: targetLog.stores?.name || `Store ${targetLog.store_id}`,
      requestAmount: targetLog.amount || 0,
      walletBalance: balance
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", storeName: "", requestAmount: 0, walletBalance: 0 });
  };

  const executeAction = async () => {
    const { id, newStatus } = confirmDialog;
    const status = newStatus.toLowerCase();
    
    closeConfirmDialog();

    try {
      const { data: exData, error: selectError } = await supabase
        .from("exchange_request")
        .select(`id, amount, status, stores(id, name, users(id, line_id))`)
        .eq("id", id)
        .single();

      if (selectError) throw selectError;
      if (exData.status === "approved") { alert("คำขอนี้ถูกอนุมัติไปแล้ว"); return; }

      const userId = exData?.stores?.users?.id;

      if (status === "approved") {
        const { data: walletData, error: walletError } = await supabase
          .from("wallet")
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle();

        if (walletError) throw walletError;
        if (!walletData) { alert("ไม่พบ wallet ของร้านค้านี้"); return; }
        if (Number(walletData.balance) < Number(exData.amount)) { alert("ยอดเงินร้านค้าไม่เพียงพอ"); return; }

        const { error: updateWalletError } = await supabase
          .from("wallet")
          .update({ balance: Number(walletData.balance) - Number(exData.amount) })
          .eq("user_id", userId);

        if (updateWalletError) throw updateWalletError;
      }

      const { error: updateStatusError } = await supabase
        .from("exchange_request")
        .update({ status })
        .eq("id", id);

      if (updateStatusError) throw updateStatusError;

      setExchangeData((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));

      const lineId = exData?.stores?.users?.line_id;
      if (lineId) {
        await fetch("/api/line/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: lineId,
            message: status === "approved"
                ? `✅ คำขอแลกเงินของร้าน ${exData.stores?.name || ""} ได้รับการอนุมัติแล้ว`
                : `❌ คำขอแลกเงินของร้าน ${exData.stores?.name || ""} ถูกปฏิเสธ`,
          }),
        });
      }
    } catch (error) {
      console.log(error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleFileUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้นครับ");
      e.target.value = ''; 
      return;
    }

    setUploadingId(id);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `slip_ID${id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("exchange_slip").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("exchange_slip").getPublicUrl(fileName);
      const publicUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase.from("exchange_request").update({ slip_url: publicUrl }).eq("id", id);
      if (dbError) throw dbError;

      setExchangeData((prev) => prev.map((item) => item.id === id ? { ...item, slip_url: publicUrl } : item));
    } catch (error) {
      alert("อัปโหลดไม่สำเร็จ: " + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteSlip = async (id, currentUrl) => {
    if (!currentUrl || !confirm("คุณต้องการลบสลิปนี้ใช่หรือไม่?")) return;

    setUploadingId(id);
    try {
      const urlParts = currentUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];

      const { error: deleteError } = await supabase.storage.from("exchange_slip").remove([fileName]);
      if (deleteError) throw deleteError;

      const { error: dbError } = await supabase.from("exchange_request").update({ slip_url: null }).eq("id", id);
      if (dbError) throw dbError;

      setExchangeData((prev) => prev.map((item) => item.id === id ? { ...item, slip_url: null } : item));
    } catch (error) {
      alert("ลบรูปไม่สำเร็จ: " + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const filteredLogs = useMemo(() => {
    let result = exchangeData;
    if (activeTab !== "All") {
      result = result.filter((log) => (log.status || "").toLowerCase() === activeTab.toLowerCase());
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          String(log.id).toLowerCase().includes(lowerSearch) ||
          (log.name && log.name.toLowerCase().includes(lowerSearch)) ||
          (log.stores?.name && log.stores.name.toLowerCase().includes(lowerSearch)),
      );
    }
    return result;
  }, [activeTab, searchTerm, exchangeData]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("th-TH", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const renderSafeString = (val) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  if (!user) return <div>กำลังโหลด...</div>;
  if (user.role !== "admin") return <div>ไม่มีสิทธิ์</div>;
  if (isLoading && exchangeData.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "50px", fontWeight: "bold", color: "#64748b" }}>
        กำลังโหลดข้อมูล... ⏳
      </div>
    );

  const isInsufficientFunds = confirmDialog.newStatus === "Approved" && Number(confirmDialog.walletBalance) < Number(confirmDialog.requestAmount);

  return (
    <div className={styles["page-container"]}>
      <div className={styles["content-wrapper"]}>
        
        {/* Header & Stats */}
        <div className={styles["header-section"]}>
          <div>
            <h1 className={styles["page-title"]}>รายการคำขอแลกเปลี่ยน</h1>
            <p className={styles["page-subtitle"]}>ตรวจสอบและอัปโหลดหลักฐานเพื่ออนุมัติ</p>
          </div>

          <div className={styles["stats-grid"]}>
            <div className={`${styles["stat-card"]} ${styles["bg-pending"]}`}>
              <span className={styles["stat-label"]}>รอดำเนินการ</span>
              <span className={styles["stat-value"]}>{stats.pending}</span>
            </div>
            <div className={`${styles["stat-card"]} ${styles["bg-approved"]}`}>
              <span className={styles["stat-label"]}>อนุมัติแล้ว</span>
              <span className={styles["stat-value"]}>{stats.approved}</span>
            </div>
            <div className={`${styles["stat-card"]} ${styles["bg-rejected"]}`}>
              <span className={styles["stat-label"]}>ปฏิเสธ</span>
              <span className={styles["stat-value"]}>{stats.rejected}</span>
            </div>
            <div className={`${styles["stat-card"]} ${styles["bg-all"]}`}>
              <span className={styles["stat-label"]}>ทั้งหมด</span>
              <span className={styles["stat-value"]}>{stats.total}</span>
            </div>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className={styles["controls-section"]}>
          <input
            type="text"
            placeholder="ค้นหา ID หรือ ชื่อบัญชี/ชื่อร้าน..."
            className={styles["search-input"]}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles["tabs-outer-container"]}>
            <div className={styles["tabs-wrapper"]}>
              {["Pending", "Approved", "Rejected", "All"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${styles["tab-btn"]} ${activeTab === tab ? styles["tab-active"] : styles["tab-inactive"]}`}
                >
                  {tab === "Pending" ? "รอดำเนินการ" : tab === "Approved" ? "อนุมัติแล้ว" : tab === "Rejected" ? "ปฏิเสธ" : "ทั้งหมด"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className={styles["cards-grid"]}>
          {filteredLogs.map((log) => {
            const isPending = (log.status || "").toLowerCase() === "pending";
            const isApproved = (log.status || "").toLowerCase() === "approved";

            return (
              <div key={log.id} className={styles["card"]}>
                <div className={styles["card-header"]}>
                  <div className={styles["header-left"]}>
                    <span className={styles["id-badge"]}>ID {log.id}</span>
                    <span className={styles["store-text"]}>Store {log.store_id}</span>
                  </div>
                  <div className={styles["header-right"]}>
                    <div className={styles["amount-label"]}>ยอดเงิน</div>
                    <div className={styles["amount-value"]}>฿{Number(log.amount || 0).toLocaleString()}</div>
                  </div>
                </div>

                <div className={styles["card-body"]}>
                  <span className={styles["info-label"]}>ชื่อร้าน</span>
                  <h4 className={styles["bank-name"]}>{renderSafeString(log.stores?.name || `Store ${log.store_id}`)}</h4>

                  <div className={styles["bank-box"]}>
                    <h4 className={styles["bank-name"]}>{renderSafeString(log.bank?.name || log.bank_id)}</h4>
                    <p className={styles["bank-no"]}>{renderSafeString(log.bank_number)}</p>
                  </div>

                  <div className={styles["info-row"]}>
                    <div>
                      <span className={styles["info-label"]}>ชื่อบัญชี</span>
                      <span className={styles["info-value-name"]}>{renderSafeString(log.name)}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className={styles["info-label"]}>วันเวลา</span>
                      <span className={styles["info-value-date"]}>{formatDateTime(log.created_at)}</span>
                    </div>
                  </div>

                  <div className={styles["upload-container"]}>
                    {uploadingId === log.id ? (
                      <div className={styles["loading-box"]}>
                        <span className={styles["loading-text"]}>กำลังอัปโหลด... ⏳</span>
                      </div>
                    ) : log.slip_url ? (
                      <div className={styles["slip-wrapper"]}>
                        <img src={log.slip_url} alt="slip" className={styles["slip-img"]} />
                        <div className={styles["slip-overlay"]}>
                          <a href={log.slip_url} target="_blank" rel="noopener noreferrer" className={styles["btn-view"]}>ดูหลักฐาน</a>
                        </div>
                        {isPending && (
                          <button onClick={() => handleDeleteSlip(log.id, log.slip_url)} className={styles["btn-remove"]}>✖</button>
                        )}
                      </div>
                    ) : isPending ? (
                      <label className={styles["upload-label"]}>
                        <div className={styles["upload-icon-text"]}>+</div>
                        <span className={styles["upload-text"]}>อัปโหลดรูปหลักฐาน</span>
                        <input type="file" style={{ display: "none" }} onChange={(e) => handleFileUpload(log.id, e)} accept="image/*" />
                      </label>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '6rem', border: '2px dashed #e2e8f0', borderRadius: '1rem', backgroundColor: '#f8fafc' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>ไม่มีรูปหลักฐาน</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles["card-footer"]}>
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleActionClick(log.id, "Rejected")}
                        className={`${styles["btn-action"]} ${styles["btn-reject"]}`}
                      >
                        ปฏิเสธ
                      </button>
                      <button
                        disabled={!log.slip_url}
                        onClick={() => handleActionClick(log.id, "Approved")}
                        className={`${styles["btn-action"]} ${styles["btn-approve"]}`}
                      >
                        อนุมัติ
                      </button>
                    </>
                  ) : (
                    <div className={`${styles["status-badge-full"]} ${isApproved ? styles["status-success"] : styles["status-fail"]}`}>
                      {isApproved ? "✓ สำเร็จเรียบร้อยแล้ว" : "✖ รายการถูกปฏิเสธ"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredLogs.length === 0 && !isLoading && (
          <div className={styles["empty-state"]}>
            <div className={styles["empty-text"]}>ไม่พบรายการที่ต้องการค้นหา</div>
            <button onClick={() => { setActiveTab("All"); setSearchTerm(""); }} className={styles["btn-reset"]}>แสดงรายการทั้งหมด</button>
          </div>
        )}
      </div>

      {/* 🌟 3. ใช้ createPortal ย้าย Modal ไปอยู่ชั้นนอกสุดของหน้าเว็บ */}
      {isMounted && confirmDialog.isOpen && createPortal(
        <div className={styles['modal-overlay']}>
          <div className={styles['modal-content']}>
            <h3 className={styles['modal-title']}>ยืนยันการทำรายการ</h3>
            <p className={styles['modal-message']}>
              คุณต้องการ<strong style={{ color: confirmDialog.newStatus === "Approved" ? "#10b981" : "#f43f5e" }}>
                {confirmDialog.newStatus === "Approved" ? "อนุมัติ" : "ปฏิเสธ"}
              </strong>รายการ ID {confirmDialog.id} ใช่หรือไม่?
            </p>

            <div className={styles['modal-details']}>
              <div className={styles['detail-row']}>
                <span>ชื่อร้าน:</span>
                <strong>{confirmDialog.storeName}</strong>
              </div>
              <div className={styles['detail-row']}>
                <span>ยอดเงินที่ขอแลก:</span>
                <strong style={{ color: '#3b82f6' }}>฿{Number(confirmDialog.requestAmount).toLocaleString()}</strong>
              </div>
              <div className={styles['detail-row']}>
                <span>ยอด Wallet ปัจจุบัน:</span>
                <strong style={{ color: isInsufficientFunds ? '#f43f5e' : '#10b981' }}>
                  ฿{Number(confirmDialog.walletBalance).toLocaleString()}
                </strong>
              </div>
              {isInsufficientFunds && (
                <div style={{ fontSize: '0.75rem', color: '#f43f5e', marginTop: '0.25rem', textAlign: 'center', fontWeight: 'bold' }}>
                  *ยอดเงินใน Wallet ของร้านค้าไม่เพียงพอ!
                </div>
              )}
            </div>

            <div className={styles['modal-actions']}>
              <button onClick={closeConfirmDialog} className={styles['btn-modal-cancel']}>
                ยกเลิก
              </button>
              <button 
                onClick={executeAction} 
                disabled={isInsufficientFunds}
                className={`${styles['btn-modal-confirm']} ${confirmDialog.newStatus === "Approved" ? styles['btn-modal-approve'] : styles['btn-modal-reject']}`}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>,
        document.body // 🌟 ดัน Popup ไปติดกับ <body> ให้อยู่จุดศูนย์กลางของจอ 100%
      )}
    </div>
  );
}