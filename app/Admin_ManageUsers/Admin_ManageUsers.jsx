"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabaseClient";
import styles from "@/app/Admin_ManageUsers/Admin_ManageUsers.module.css";
import { createNewUserByAdmin } from '@/app/Admin_ManageUsers/userActions';

export default function ManageUsers() {
  const [usersData, setUsersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [copiedId, setCopiedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '',password:'', role: 'store_owner' });
  
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    
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

  async function fetchUsers() {
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users") 
        .select(`id, username, role, created_at, email`)
        .order("created_at", { ascending: false });
      console.log("เช็คค่าที่ดึงมา:", { data, error })
      if (error) throw error;
      setUsersData(data || []);
    } catch (error) {
      alert("ดึงข้อมูลพลาด: " + error.message);
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    let result = usersData;
    
    if (activeTab !== 'All') {
      result = result.filter(user => (user.role || '').toLowerCase() === activeTab.toLowerCase());
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(user => 
        (user.id && String(user.id).toLowerCase().includes(lowerSearch)) || 
        (user.username && user.username.toLowerCase().includes(lowerSearch)) ||
        (user.email && user.email.toLowerCase().includes(lowerSearch))
      );
    }
    return result;
  }, [activeTab, searchTerm, usersData]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("th-TH", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const handleCopyId = (id) => {
    const textArea = document.createElement("textarea");
    textArea.value = id;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); 
    } catch (err) {
      console.error('Failed to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsModalOpen(false); // ปิด modal ไปก่อนระหว่างประมวลผล

    // เรียกใช้ฟังก์ชันที่เราเพิ่งสร้าง
    const result = await createNewUserByAdmin({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role
    });

    if (result.success) {
      alert("สร้างบัญชีผู้ใช้งานและกระเป๋าเงินสำเร็จ!");
      fetchUsers(); // รีเฟรชข้อมูลตาราง
      setFormData({ username: '', email: '', password: '', role: 'store_owner' }); // ล้างค่าฟอร์ม
    } else {
      alert("เกิดข้อผิดพลาด: " + result.error);
      setIsModalOpen(true); // เปิด modal กลับมาให้แอดมินแก้ข้อมูล
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>กำลังโหลดข้อมูล... ⏳</div>;
  }
  if (!user) return <div>กำลังโหลด...</div>;

  if (user.role !== "admin") {
    return <div>ไม่มีสิทธิ์</div>;
  }
  return (
    <div className={styles.container}>
      {/* Header & Add Button */}
      <div className={styles.adminControlHeader}>
        <h1 className={styles.title}>จัดการผู้ใช้งาน (Users)</h1>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          + เพิ่มบัญชีร้านค้า
        </button>
      </div>
      
      <hr className={styles.divider} />

      {/* Search & Category Filter */}
      <div className={styles.top}>
        <div className={styles.search}>
          <input 
            type="text" 
            placeholder="ค้นหา ID, ชื่อผู้ใช้ หรือ อีเมล..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* === เปลี่ยนมาใช้รูปแบบตาราง (DATA TABLE) === */}
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID (UUID)</th>
              <th>การจัดการ</th>
              <th>Username</th>
              <th>Role</th>
              <th>Email</th>
              <th>สร้างเมื่อ</th>
              
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span className={styles.idBadge}>
                      {user.id.slice(0, 8)}...{user.id.slice(-4)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.adminActions}>
                      <button 
                        onClick={() => handleCopyId(user.id)} 
                        className={styles.copyLink}
                      >
                        {copiedId === user.id ? 'คัดลอกสำเร็จ ✓' : 'คัดลอก UID'}
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{user.username}</td>
                  <td className={styles.roleText}>{user.role}</td>
                  <td style={{ color: '#475569' }}>{user.email}</td>
                  <td style={{ color: '#64748b', fontSize: '14px' }}>
                    {formatDateTime(user.created_at)}
                  </td>

                </tr> 
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles.emptyState}>
                  ไม่พบข้อมูลผู้ใช้งานที่ตรงกับการค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Overlay & Container */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>เพิ่มบัญชีเจ้าของร้าน</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeX}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>ชื่อผู้ใช้ (Username)</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="เช่น store_bkk_01"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>อีเมล (Email)</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="เช่น contact@store.com"
                />

              </div>
                <div className={styles.formGroup}>
                <label>รหัสผ่าน (Password)</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="เช่น qweqwe"
                />
              </div>


              <div className={styles.formGroup}>
                <label>สิทธิ์การใช้งาน (Role)</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="store_owner">เจ้าของร้าน (Store Owner)</option>
                  <option value="customer">ลูกค้า (Customer)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                  ยกเลิก
                </button>
                <button type="submit" className={styles.submitBtn}>
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}