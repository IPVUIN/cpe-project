"use client";
import styles from "@/app/exchange_log/exchange_log.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ExchangeLog() {
  const [exchangeData, setExchangeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all");

  const [searchId, setSearchId] = useState("");
  // เปลี่ยน State เป็นค้นหาจากชื่อร้าน
  const [searchStoreName, setSearchStoreName] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    async function loadUser() {
      setIsAuthLoading(true);
      const { data: auth } = await supabase.auth.getUser();

      if (auth?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", auth.user.id)
          .single();
        setUser(profile);
      }
      setIsAuthLoading(false);
    }
    loadUser();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("exchange_request")
        .select(`
          id, 
          store_id,
          stores ( name ), 
          bank_id, 
          bank_number,
          name, 
          status, 
          amount, 
          slip_url, 
          created_at,
          bank ( name ) 
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

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    if (!status) return "";
    const lower = status.toLowerCase();
    if (lower === "pending") return styles["status-pending"];
    if (lower === "approved" || lower === "success") return styles["status-completed"];
    if (lower === "rejected" || lower === "failed") return styles["status-rejected"];
    return "";
  };

  const handleClearFilters = () => {
    setSearchId("");
    setSearchStoreName(""); // เคลียร์ค่าค้นหาชื่อร้าน
    setSearchAmount("");
    setSearchDate("");
  };

  const filteredData = exchangeData.filter((row) => {
    let isTabMatch = false;
    if (activeTab === "all") {
      isTabMatch = true;
    } else {
      const status = (row.status || "").toLowerCase();
      if (activeTab === "pending") isTabMatch = status === "pending";
      if (activeTab === "approved") isTabMatch = status === "approved" || status === "success";
      if (activeTab === "rejected") isTabMatch = status === "rejected" || status === "failed";
    }

    const matchId = searchId === "" || String(row.id).toLowerCase().includes(searchId.toLowerCase());
    
    // เปลี่ยนเงื่อนไขมาค้นหาจากชื่อร้าน
    const storeName = row.stores?.name || "";
    const matchStoreName = searchStoreName === "" || storeName.toLowerCase().includes(searchStoreName.toLowerCase());
    
    const matchAmount = searchAmount === "" || String(row.amount).toLowerCase().includes(searchAmount.toLowerCase());
    const formattedDate = formatDateTime(row.created_at).toLowerCase();
    const matchDate = searchDate === "" || formattedDate.includes(searchDate.toLowerCase());

    // นำ matchStoreName มาใช้แทน matchStoreId
    return isTabMatch && matchId && matchStoreName && matchAmount && matchDate;
  });

  const renderSafeString = (val) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  if (isLoading || isAuthLoading) return <div style={{ textAlign: "center", padding: "50px" }}>กำลังโหลดข้อมูล... ⏳</div>;

  if (!user || user.role !== "admin") {
    return <div style={{ textAlign: "center", padding: "50px", color: "red" }}>ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  return (
    <div className={styles["page-container"]}>
      <h2 className={styles["page-title"]}>รายการคำขอแลกเปลี่ยน (Exchange Logs)</h2>

      <div className={styles["tabs-container"]}>
        {["pending", "approved", "rejected", "all"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles["tab-btn"]} ${activeTab === tab ? styles[`tab-active-${tab}`] : styles["tab-inactive"]}`}
          >
            {tab === "pending" ? "รอดำเนินการ" : tab === "approved" ? "อนุมัติแล้ว" : tab === "rejected" ? "ปฏิเสธ" : "ทั้งหมด"}
          </button>
        ))}
      </div>

      <div className={styles["filters-container"]}>
        <input type="text" placeholder="ค้นหา ID..." value={searchId} onChange={(e) => setSearchId(e.target.value)} className={styles["filter-input"]} />
        {/* เปลี่ยน Placeholder เป็นค้นหาชื่อร้าน */}
        <input type="text" placeholder="ค้นหาชื่อร้าน..." value={searchStoreName} onChange={(e) => setSearchStoreName(e.target.value)} className={styles["filter-input"]} />
        <input type="text" placeholder="ค้นหาจำนวนเงิน..." value={searchAmount} onChange={(e) => setSearchAmount(e.target.value)} className={styles["filter-input"]} />
        <input type="text" placeholder="ค้นหาวันที่..." value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className={styles["filter-input"]} />
        <button onClick={handleClearFilters} className={styles["btn-clear"]}>✖ ล้างค้นหา</button>
      </div>

      <div className={styles["table-card"]}>
        <table className={styles["data-table"]}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Store</th>
              <th>ธนาคาร</th>
              <th>เลขบัญชี</th>
              <th>ชื่อบัญชี</th>
              <th>จำนวน</th>
              <th style={{ textAlign: "center" }}>Status</th>
              <th>สลิปการโอน</th>
              <th>สร้างเมื่อ</th>
              {/* ลบ <th>จัดการ</th> ออกแล้ว */}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.id}</strong></td>
                  <td>{row.stores?.name || row.store_id}</td>
                  <td>{renderSafeString(row.bank?.name || row.bank_id)}</td>
                  <td>{renderSafeString(row.bank_number)}</td>
                  <td>{renderSafeString(row.name)}</td>
                  <td style={{ fontWeight: "bold", color: "#2563eb" }}>฿{Number(row.amount || 0).toLocaleString()}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`${styles["status-badge"]} ${getStatusClass(row.status)}`}>{row.status || "Unknown"}</span>
                  </td>
                  <td>
                    {row.slip_url ? (
                      <a href={row.slip_url} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>ดูสลิป</a>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>-</span>
                    )}
                  </td>
                  <td>{formatDateTime(row.created_at)}</td>
                  {/* ลบ <td> ที่มีปุ่มแก้ไขออกแล้ว */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                  ไม่พบข้อมูลที่ตรงกับการค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 