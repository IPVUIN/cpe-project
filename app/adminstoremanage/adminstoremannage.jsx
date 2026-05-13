"use client";

import styles from "@/app/adminstoremanage/adstoremenage.module.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

import { createNewUserByAdmin } from "@/app/adminstoremanage/userActions"; 

export default function AdminStoreManage({ stores: initialStores, category }) {
  const [stores, setStores] = useState(initialStores || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [cate, setCate] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    store_category: "",
    description: "",
    username: "",
    email: "",
    password: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", auth.user.id)
          .single();
        setUser(profile);
      }
    }
    loadUser();
  }, []);

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ 
      name: "", store_category: "", description: "", 
      username: "", email: "", password: "" 
    });
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
       
    const userRes = await createNewUserByAdmin({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: "store_owner", 
    });

    if (!userRes.success) {
      alert("ไม่สามารถสร้างบัญชีเจ้าของร้านได้: " + userRes.error);
      setUploading(false);
      return;
    }

    const newOwnerId = userRes.userId; // ได้ ID ของเจ้าของร้านคนใหม่มาแล้ว

    let finalImageUrl = "";
    if (imageFile) {
      const fileName = `${Date.now()}_${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("store-images") 
        .upload(fileName, imageFile);

      if (!uploadError) {
        const { data: publicUrl } = supabase.storage
          .from("store-images")
          .getPublicUrl(fileName);
        finalImageUrl = publicUrl.publicUrl;
      } else {
        alert("อัปโหลดรูปไม่สำเร็จ: " + uploadError.message);
        setUploading(false);
        return;
      }
    }

    const payload = { 
      name: formData.name,
      store_category: formData.store_category,
      description: formData.description,
      image_url: finalImageUrl,
      user_id: newOwnerId 
    };

    const { data, error } = await supabase
      .from("stores")
      .insert([payload])
      .select();

    if (!error && data) {
      setStores([...stores, data[0]]);
      closeModal();
      alert("สร้างบัญชีผู้ใช้และร้านค้าสำเร็จเรียบร้อย!");
    } else {
      alert("เกิดข้อผิดพลาดในการสร้างร้าน: " + error?.message);
    }
    
    setUploading(false);
  };

  const filteredStores = stores.filter((store) => {
    if (!store) return false;
    const safeName = store.name || "";
    const matchSearch = safeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = cate ? store.store_category === cate : true;
    return matchSearch && matchCategory;
  });

  if (!mounted) return null;
  const sortedStores = [...filteredStores].sort((a, b) => a.id - b.id);

  if (!user) return <div>กำลังโหลด...</div>;
  if (user?.role !== "admin") return <div>ไม่มีสิทธิ์</div>;

  return (
    <div className={styles.container}>
      {/* --- ส่วน Header และส่วนแสดงการ์ดร้านค้ายังเหมือนเดิม --- */}
      <div className={styles.adminControlHeader}>
        <div><h1 className={styles.title}>Store Management</h1></div>
        <button onClick={handleAddClick} className={styles.addBtn}>+ เพิ่มร้านค้าใหม่</button>
      </div>

      <hr className={styles.divider} />

      {/* ช่องค้นหา */}
      <div className={styles.top}>
        <div className={styles.search}>
          <input
            type="text"
            placeholder="ค้นหาชื่อร้านค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.category}>
          <button onClick={() => setCate(null)} className={cate === null ? styles.active : ""}>ทั้งหมด</button>
          {category?.map((cat) => (
            <button key={cat.id} onClick={() => setCate(cat.id)} className={cate === cat.id ? styles.active : ""}>{cat.name}</button>
          ))}
        </div>
      </div>

      {/* รายการร้านค้า */}
      <div className={styles.listshop}>
        {sortedStores.length > 0 ? (
          sortedStores.map((item) => (
            <div key={item.id} className={styles.shopdiv}>
              <div className={styles.cardContent}>
                <div className={styles.divimage}>
                  <Link href={"/AdminEditshop/" + item.id}>
                    <Image src={item.image_url || "/miko.jpg"} fill alt="shopicon" className={styles.imagestore} />
                  </Link>
                  <div className={styles.idBadge}>ID: {item.id}</div>
                  {item.is_active === false && <div className={styles.closedBadge}>ปิดร้าน</div>}
                </div>
                <div className={styles.textcard}>
                  <h3>{item.name || "ไม่มีชื่อร้าน"}</h3>
                  <p>{item.description || "ไม่มีคำอธิบายร้านค้า"}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>ไม่พบข้อมูลร้านค้า</div>
        )}
      </div>

      {/* หน้าต่าง Modal (อัปเดตฟอร์มรับข้อมูล) */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>เพิ่มร้านค้าใหม่</h2>
              <button type="button" className={styles.closeX} onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              
              {/* ข้อมูลร้านค้า */}
              <h4 style={{ margin: "0 0 10px 0", color: "#f97316" }}>ข้อมูลร้านค้า</h4>
              <div className={styles.formGroup}>
                <label>ชื่อร้าน</label>
                <input type="text" required placeholder="กรุณากรอกชื่อร้าน" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className={styles.formGroup}>
                <label>หมวดหมู่</label>
                <select required value={formData.store_category} onChange={(e) => setFormData({...formData, store_category: e.target.value})}>
                  <option value="">เลือกหมวดหมู่</option>
                  {category?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>คำอธิบาย/สโลแกน</label>
                <input type="text" placeholder="สโลแกนร้านค้า" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>

              <hr className={styles.divider} style={{ margin: "15px 0" }} />

              {/* ข้อมูลสำหรับสมัครสมาชิกเจ้าของร้าน */}
              <h4 style={{ margin: "0 0 10px 0", color: "#f97316" }}>ข้อมูลบัญชีเจ้าของร้าน</h4>
              <div className={styles.formGroup}>
                <label>ชื่อผู้ใช้งาน (Username)</label>
                <input type="text" required placeholder="เช่น john_store" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
              </div>

              <div className={styles.formGroup}>
                <label>อีเมล</label>
                <input type="email" required placeholder="email@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>

              <div className={styles.formGroup}>
                <label>รหัสผ่าน</label>
                <input type="password" required minLength="6" placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>

              <hr className={styles.divider} style={{ margin: "15px 0" }} />

              <div className={styles.formGroup}>
                <label>รูปภาพร้านค้า</label>
                <div className={styles.imageUploadWrapper}>
                  {!previewUrl ? (
                    <label className={styles.uploadPlaceholder}>
                      <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                      <div className={styles.uploadContent}>
                        <span className={styles.plusIcon}>+</span>
                        <p>อัปโหลดรูปภาพ</p>
                      </div>
                    </label>
                  ) : (
                    <div className={styles.previewContainer}>
                      <Image src={previewUrl} fill alt="preview" className={styles.previewImage} />
                      <div className={styles.previewOverlay}>
                        <label className={styles.viewBtn}>
                          เปลี่ยนรูปภาพ
                          <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>ยกเลิก</button>
                <button type="submit" className={styles.submitBtn} disabled={uploading}>
                  <span className={styles.saveIcon}>💾</span> 
                  {uploading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}