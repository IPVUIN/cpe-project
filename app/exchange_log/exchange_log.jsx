"use client";
import styles from "@/app/exchange_log/exchange_log.module.css"; 
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ExchangeLog() { 
  const [exchangeData, setExchangeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false); 

  const [activeTab, setActiveTab] = useState("all");
  
  const [searchId, setSearchId] = useState("");
  const [searchStoreId, setSearchStoreId] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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
          id, 
          store_id, 
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


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };


  const handleUploadSlip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `slip_ID${editingId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("exchange_slip").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("exchange_slip").getPublicUrl(fileName);
      setEditFormData({ ...editFormData, slip_url: publicUrlData.publicUrl });
      alert("อัปโหลดสลิปสำเร็จ! กรุณากดปุ่ม 'บันทึก' เพื่อยืนยัน");
    } catch (error) {
      alert("อัปโหลดไม่สำเร็จ: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("th-TH", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    if (!status) return "";
    const lower = status.toLowerCase();
    if (lower === "pending") return styles['status-pending']; 
    if (lower === "approved" || lower === "success") return styles['status-completed'];
    if (lower === "rejected" || lower === "failed") return styles['status-rejected'];
    return "";
  };

  const handleClearFilters = () => {
    setSearchId("");
    setSearchStoreId("");
    setSearchAmount("");
    setSearchDate("");
  };

  const filteredData = exchangeData.filter(row => {
    let isTabMatch = false;
    if (activeTab === 'all') {
      isTabMatch = true; 
    } else {
      const status = (row.status || '').toLowerCase();
      if (activeTab === 'pending') isTabMatch = status === 'pending';
      if (activeTab === 'approved') isTabMatch = status === 'approved' || status === 'success';
      if (activeTab === 'rejected') isTabMatch = status === 'rejected' || status === 'failed';
    }

    const matchId = searchId === "" || String(row.id).toLowerCase().includes(searchId.toLowerCase());
    const matchStoreId = searchStoreId === "" || String(row.store_id).toLowerCase().includes(searchStoreId.toLowerCase());
    const matchAmount = searchAmount === "" || String(row.amount).toLowerCase().includes(searchAmount.toLowerCase());
    
    const formattedDate = formatDateTime(row.created_at).toLowerCase();
    const matchDate = searchDate === "" || formattedDate.includes(searchDate.toLowerCase());

    return isTabMatch && matchId && matchStoreId && matchAmount && matchDate;
  });

  const renderSafeString = (val) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "object") return JSON.stringify(val); 
    return String(val);
  };

  if (isLoading) return <div style={{ textAlign: "center", padding: "50px" }}>กำลังโหลดข้อมูล... ⏳</div>;

  if (user.role !== "admin") {
    return <div>ไม่มีสิทธิ์</div>;
  }

  return (
    <div className={styles['page-container']}> 
      <h2 className={styles['page-title']}>รายการคำขอแลกเปลี่ยน (Exchange Logs)</h2>
      
      <div className={styles['tabs-container']}>
        <button 
          onClick={() => { setActiveTab('pending'); setEditingId(null); }}
          className={`${styles['tab-btn']} ${activeTab === 'pending' ? styles['tab-active-pending'] : styles['tab-inactive']}`}
        >
          รอดำเนินการ
        </button>
        <button 
          onClick={() => { setActiveTab('approved'); setEditingId(null); }}
          className={`${styles['tab-btn']} ${activeTab === 'approved' ? styles['tab-active-approved'] : styles['tab-inactive']}`}
        >
          อนุมัติแล้ว
        </button>
        <button 
          onClick={() => { setActiveTab('rejected'); setEditingId(null); }}
          className={`${styles['tab-btn']} ${activeTab === 'rejected' ? styles['tab-active-rejected'] : styles['tab-inactive']}`}
        >
          ปฏิเสธ
        </button>
        <button 
          onClick={() => { setActiveTab('all'); setEditingId(null); }}
          className={`${styles['tab-btn']} ${activeTab === 'all' ? styles['tab-active-all'] : styles['tab-inactive']}`}
        >
          ทั้งหมด
        </button>
      </div>

      <div className={styles['filters-container']}>
        <input 
          type="text" 
          placeholder="ค้นหา ID..." 
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className={styles['filter-input']}
        />
        <input 
          type="text" 
          placeholder="ค้นหา Store ID..." 
          value={searchStoreId}
          onChange={(e) => setSearchStoreId(e.target.value)}
          className={styles['filter-input']}  
        />
        <input 
          type="text" 
          placeholder="ค้นหาจำนวนเงิน..." 
          value={searchAmount}
          onChange={(e) => setSearchAmount(e.target.value)}
          className={styles['filter-input']}
        />
        <input 
          type="text" 
          placeholder="ค้นหาวันที่..." 
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className={styles['filter-input']}
        />
        <button onClick={handleClearFilters} className={styles['btn-clear']}>
          ✖ ล้างค้นหา
        </button>
      </div>

      <div className={styles['table-card']}>
        <table className={styles['data-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Store ID</th>
              <th>ธนาคาร</th>       
              <th>เลขบัญชี</th> 
              <th>ชื่อบัญชี</th>  
              <th>จำนวน</th>
              <th style={{textAlign:'center'}}>Status</th>
              <th>สลิปการโอน</th>
              <th>สร้างเมื่อ</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr key={row.id}>
                  {editingId === row.id ? (
                    <>
                      <td><strong>{row.id}</strong></td>
                      <td>{row.store_id}</td>
                      <td>{renderSafeString(row.bank?.name || row.bank_id)}</td>           
                      <td>{renderSafeString(row.bank_number)}</td>
                      <td>{renderSafeString(row.name)}</td>       
                      <td style={{ fontWeight: "bold", color: "#2563eb" }}>฿{Number(row.amount || 0).toLocaleString()}</td>
                      <td>
                        <select name="status" value={editFormData.status || "pending"} onChange={handleInputChange} className={styles['edit-input']}>
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                        </select>
                      </td>
                      <td>
                        {editFormData.slip_url ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <a href={editFormData.slip_url} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline", fontSize: "14px" }}>ดูสลิปปัจจุบัน</a>
                          </div>
                        ) : (
                          <div>
                            <input type="file" accept="image/*" onChange={handleUploadSlip} disabled={isUploading} style={{ fontSize: "13px", maxWidth: "200px" }} />
                            {isUploading && <div style={{ fontSize: "12px", color: "#2563eb", marginTop: "4px" }}>กำลังอัปโหลด... ⏳</div>}
                          </div>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td><strong>{row.id}</strong></td>
                      <td>{row.store_id}</td>
                      <td>{renderSafeString(row.bank?.name || row.bank_id)}</td>           
                      <td>{renderSafeString(row.bank_number)}</td>
                      <td>{renderSafeString(row.name)}</td>       
                      <td style={{ fontWeight: "bold", color: "#2563eb" }}>฿{Number(row.amount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`${styles['status-badge']} ${getStatusClass(row.status)}`}>{row.status || "Unknown"}</span>
                      </td>
                      <td>
                        {row.slip_url ? (
                          <a href={row.slip_url} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>ดูสลิป</a>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                      <td>{formatDateTime(row.created_at)}</td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
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