"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabaseClient";
import styles from "@/app/Admin_exchange/Admin_exchange.module.css"; 

export default function ExchangeLog() {
  const [exchangeData, setExchangeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null); 
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchData();
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
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("exchange_request") 
        .select(`
          id, store_id, bank_id, bank_number, name, status, amount, slip_url, created_at,
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

  const stats = useMemo(() => {
    return {
      pending: exchangeData.filter(l => (l.status || '').toLowerCase() === 'pending').length,
      approved: exchangeData.filter(l => (l.status || '').toLowerCase() === 'approved').length,
      rejected: exchangeData.filter(l => (l.status || '').toLowerCase() === 'rejected').length,
      total: exchangeData.length
    };
  }, [exchangeData]);

  const handleAction = async (id, newStatus) => {
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${newStatus} ใช่หรือไม่?`)) return;
    
    try {
      const { error } = await supabase
        .from("exchange_request")
        .update({ status: newStatus.toLowerCase() })
        .eq("id", id);

      if (error) throw error;
      setExchangeData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus.toLowerCase() } : item));
    } catch (error) {
      alert("ไม่สามารถอัปเดตสถานะได้: " + error.message);
    }
  };

  const handleFileUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(id); 
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `slip_ID${id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("exchange_slip").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("exchange_slip").getPublicUrl(fileName);
      const publicUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase.from("exchange_request").update({ slip_url: publicUrl }).eq("id", id);
      if (dbError) throw dbError;

      setExchangeData(prev => prev.map(item => item.id === id ? { ...item, slip_url: publicUrl } : item));
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
      const urlParts = currentUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error: deleteError } = await supabase.storage.from("exchange_slip").remove([fileName]);
      if (deleteError) throw deleteError;

      const { error: dbError } = await supabase.from("exchange_request").update({ slip_url: null }).eq("id", id);
      if (dbError) throw dbError;

      setExchangeData(prev => prev.map(item => item.id === id ? { ...item, slip_url: null } : item));
    } catch (error) {
      alert("ลบรูปไม่สำเร็จ: " + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const filteredLogs = useMemo(() => {
    let result = exchangeData;
    if (activeTab !== 'All') {
      result = result.filter(log => (log.status || '').toLowerCase() === activeTab.toLowerCase());
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(log => 
        String(log.id).toLowerCase().includes(lowerSearch) || 
        (log.name && log.name.toLowerCase().includes(lowerSearch))
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

  if (user.role !== "admin") {
    return <div>ไม่มีสิทธิ์</div>;
  }

  if (isLoading) return <div style={{ textAlign: "center", padding: "50px", fontWeight: "bold", color: "#64748b" }}>กำลังโหลดข้อมูล... ⏳</div>;

  return (
    <div className={styles['page-container']}>
      <div className={styles['content-wrapper']}>
        
        {/* Header & Stats */}
        <div className={styles['header-section']}>
          <div>
            <h1 className={styles['page-title']}>รายการคำขอแลกเปลี่ยน</h1>
            <p className={styles['page-subtitle']}>ตรวจสอบและอัปโหลดหลักฐานเพื่ออนุมัติ</p>
          </div>

          <div className={styles['stats-grid']}>
            <div className={`${styles['stat-card']} ${styles['bg-pending']}`}>
              <span className={styles['stat-label']}>รอดำเนินการ</span>
              <span className={styles['stat-value']}>{stats.pending}</span>
            </div>
            <div className={`${styles['stat-card']} ${styles['bg-approved']}`}>
              <span className={styles['stat-label']}>อนุมัติแล้ว</span>
              <span className={styles['stat-value']}>{stats.approved}</span>
            </div>
            <div className={`${styles['stat-card']} ${styles['bg-rejected']}`}>
              <span className={styles['stat-label']}>ปฏิเสธ</span>
              <span className={styles['stat-value']}>{stats.rejected}</span>
            </div>
            <div className={`${styles['stat-card']} ${styles['bg-all']}`}>
              <span className={styles['stat-label']}>ทั้งหมด</span>
              <span className={styles['stat-value']}>{stats.total}</span>
            </div>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className={styles['controls-section']}>
          <input 
            type="text" 
            placeholder="ค้นหา ID หรือ ชื่อบัญชี..." 
            className={styles['search-input']}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles['tabs-wrapper']}>
            {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${styles['tab-btn']} ${activeTab === tab ? styles['tab-active'] : styles['tab-inactive']}`}
              >
                {tab === 'Pending' ? 'รอดำเนินการ' : tab === 'Approved' ? 'อนุมัติแล้ว' : tab === 'Rejected' ? 'ปฏิเสธ' : 'ทั้งหมด'}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className={styles['cards-grid']}>
          {filteredLogs.map((log) => {
            const isPending = (log.status || '').toLowerCase() === 'pending';
            const isApproved = (log.status || '').toLowerCase() === 'approved';
            
            return (
              <div key={log.id} className={styles['card']}>
                
                {/* Header Card */}
                <div className={styles['card-header']}>
                  <div className={styles['header-left']}>
                    <span className={styles['id-badge']}>ID {log.id}</span>
                    <span className={styles['store-text']}>Store {log.store_id}</span>
                  </div>
                  <div className={styles['header-right']}>
                    <div className={styles['amount-label']}>ยอดเงิน</div>
                    <div className={styles['amount-value']}>฿{Number(log.amount || 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* Body Card */}
                <div className={styles['card-body']}>
                  
                  {/* Bank Info */}
                  <div className={styles['bank-box']}>
                    <h4 className={styles['bank-name']}>{renderSafeString(log.bank?.name || log.bank_id)}</h4>
                    <p className={styles['bank-no']}>{renderSafeString(log.bank_number)}</p>
                  </div>

                  {/* Account Info */}
                  <div className={styles['info-row']}>
                    <div>
                      <span className={styles['info-label']}>ชื่อบัญชี</span>
                      <span className={styles['info-value-name']}>{renderSafeString(log.name)}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className={styles['info-label']}>วันเวลา</span>
                      <span className={styles['info-value-date']}>{formatDateTime(log.created_at)}</span>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div className={styles['upload-container']}>
                    {uploadingId === log.id ? (
                      <div className={styles['loading-box']}>
                        <span className={styles['loading-text']}>กำลังอัปโหลด... ⏳</span>
                      </div>
                    ) : log.slip_url ? (
                      <div className={styles['slip-wrapper']}>
                        <img src={log.slip_url} alt="slip" className={styles['slip-img']} />
                        <div className={styles['slip-overlay']}>
                          <a href={log.slip_url} target="_blank" rel="noopener noreferrer" className={styles['btn-view']}>
                            ดูหลักฐาน
                          </a>
                        </div>
                        {isPending && (
                          <button onClick={() => handleDeleteSlip(log.id, log.slip_url)} className={styles['btn-remove']}>
                            ✖
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className={styles['upload-label']}>
                        <div className={styles['upload-icon-text']}>+</div>
                        <span className={styles['upload-text']}>อัปโหลดรูปหลักฐาน</span>
                        <input type="file" style={{ display: "none" }} onChange={(e) => handleFileUpload(log.id, e)} accept="image/*" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className={styles['card-footer']}>
                  {isPending ? (
                    <>
                      <button onClick={() => handleAction(log.id, 'Rejected')} className={`${styles['btn-action']} ${styles['btn-reject']}`}>
                        REJECT
                      </button>
                      <button 
                        disabled={!log.slip_url} 
                        onClick={() => handleAction(log.id, 'Approved')} 
                        className={`${styles['btn-action']} ${styles['btn-approve']}`}
                      >
                        APPROVE
                      </button>
                    </>
                  ) : (
                    <>
                    <div className={`${styles['status-badge-flex']} ${isApproved ? styles['status-success'] : styles['status-fail']}`}>
                      {isApproved ? '✓ สำเร็จเรียบร้อยแล้ว' : '✖ รายการถูกปฏิเสธ'}
                    </div>
                    <button 
                        onClick={() => handleAction(log.id, 'Pending')} 
                        className={`${styles['btn-action']} ${styles['btn-edit']}`}
                      >
                        แก้ไข
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredLogs.length === 0 && !isLoading && (
          <div className={styles['empty-state']}>
             <div className={styles['empty-text']}>ไม่พบรายการที่ต้องการค้นหา</div>
             <button onClick={() => {setActiveTab('All'); setSearchTerm('');}} className={styles['btn-reset']}>
               แสดงรายการทั้งหมด
             </button>
          </div>
        )}
      </div>
    </div>
  );
}