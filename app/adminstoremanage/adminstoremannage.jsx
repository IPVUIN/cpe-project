"use client";

import styles from "@/app/adminstoremanage/adstoremenage.module.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AdminStoreManage({ stores: initialStores, category }) {
  const [stores, setStores] = useState(initialStores || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [cate, setCate] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);

  // States สำหรับ Modal และ Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    store_category: "",
    description: "",
    user_id: "",
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

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      setUser(profile);


    }
    loadUser();
  }, []); 

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditId(null);
    setFormData({ name: "", store_category: "", description: "", user_id: "" });
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleAddClick = () => {
    setIsEditMode(false);
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (store) => {
    setIsEditMode(true);
    setEditId(store.id);
    setFormData({
      name: store.name || "",
      store_category: store.store_category || "",
      description: store.description || "",
      user_id: store.user_id || "",
    });
    setPreviewUrl(store.image_url || null); 
    setIsModalOpen(true);
  };

  // ⭐️ ฟังก์ชันเปิด-ปิดร้านค้า (แทนที่การลบข้อมูล)
const handleToggleStatus = async (id, currentStatus, name) => {
    const newStatus = !currentStatus; // สลับค่า TRUE / FALSE
    const actionText = newStatus ? "เปิดร้าน" : "ปิดร้าน";
    
    if (!confirm(`ยืนยันการ${actionText}: ${name}?`)) return;

    // ลองแสดงค่าที่จะส่งไปดูใน Console (F12)
    console.log(`กำลังอัปเดต ID: ${id} | สถานะใหม่: ${newStatus}`);

    const { data, error } = await supabase
      .from("stores")
      .update({ is_active: newStatus })
      .eq("id", id)
      .select();

    // เช็คผลลัพธ์ที่ได้กลับมาจาก Supabase
    console.log("ผลลัพธ์จาก Supabase:", data, error);

    if (error) {
      alert(`ไม่สามารถ${actionText}ได้ (เกิดข้อผิดพลาด): ` + error.message);
      console.error("Toggle Status Error:", error);
    } else if (data && data.length > 0) {
      // ✅ อัปเดตสำเร็จ (ต้องมี data กลับมาอย่างน้อย 1 ตัว)
      setStores(stores.map((item) => (item?.id === id ? data[0] : item)));
    } else {
      // ❌ อัปเดตไม่สำเร็จ (ไม่มี Error แต่ไม่มีข้อมูลถูกแก้ไข)
      alert(`อัปเดตไม่สำเร็จ! โปรดตรวจสอบสิทธิ์ RLS Policy (UPDATE) ใน Supabase`);
      console.warn("ถูก Supabase บล็อก หรือหา ID ไม่เจอ (Data เป็น Array ว่าง)");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    let finalImageUrl = isEditMode ? previewUrl : "";

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
      ...formData, 
      image_url: finalImageUrl,
      user_id: formData.user_id || null
    };

    if (isEditMode) {
      const { data, error } = await supabase
        .from("stores")
        .update(payload)
        .eq("id", editId)
        .select();

      if (!error && data) {
        setStores(stores.map(store => store?.id === editId ? data[0] : store));
        closeModal();
      } else {
        alert("เกิดข้อผิดพลาดในการแก้ไข: " + error?.message);
      }
    } else {
      const { data, error } = await supabase
        .from("stores")
        .insert([payload])
        .select();

      if (!error && data) {
        setStores([...stores, data[0]]);
        closeModal();
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + error?.message);
      }
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

  if (user.role !== "admin") {
    return <div>ไม่มีสิทธิ์</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.adminControlHeader}>
        <div>
          <h1 className={styles.title}>Store Management</h1>
        </div>
        <button onClick={handleAddClick} className={styles.addBtn}>
          + เพิ่มร้านค้าใหม่
        </button>
      </div>

      <hr className={styles.divider} />

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
          <button 
            onClick={() => setCate(null)} 
            className={cate === null ? styles.active : ""}
          >
            ทั้งหมด
          </button>
          {category?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCate(cat.id)}
              className={cate === cat.id ? styles.active : ""}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.listshop}>
        {sortedStores.length > 0 ? (
          sortedStores.map((item) => (
            <div key={item.id} className={styles.shopdiv}>
              <div className={styles.cardContent}>
                <div className={styles.divimage}>
                  <Link href={"/AdminEditshop/" + item.id}>
                  <Image
                    src={item.image_url || "/miko.jpg"}
                    fill
                    alt="shopicon"
                    className={styles.imagestore}
                  />
                  </Link>
                  <div className={styles.idBadge}>ID: {item.id}</div>
                  
                  {/* ⭐️ ป้ายบอกสถานะ ถ้า is_active เป็น false ให้โชว์ว่าปิดร้าน ⭐️ */}
                  {item.is_active === false && (
                    <div className={styles.closedBadge}>ปิดร้าน</div>
                  )}
                </div>

                <div className={styles.textcard}>
                  <h3>{item.name || "ไม่มีชื่อร้าน"}</h3>
                  <p>{item.description || "ไม่มีคำอธิบายร้านค้า"}</p>
                  
                  <div className={styles.adminActions}>
                    <button 
                      onClick={() => handleEditClick(item)} 
                      className={styles.editLink}
                    >
                      แก้ไข
                    </button>
                    {/* ⭐️ ปุ่มเปิด-ปิดร้าน สลับสีตามสถานะ ⭐️ */}
                    <button 
                      onClick={() => handleToggleStatus(item.id, item.is_active, item.name)}
                      className={item.is_active ? styles.closeBtn : styles.openBtn}
                    >
                      {item.is_active ? "ปิดร้าน" : "เปิดร้าน"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>ไม่พบข้อมูลร้านค้า</div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{isEditMode ? "แก้ไขข้อมูลร้านค้า" : "เพิ่มร้านค้าใหม่"}</h2>
              <button type="button" className={styles.closeX} onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>ชื่อร้าน</label>
                <input 
                  type="text" 
                  required 
                  placeholder="กรุณากรอกชื่อร้าน"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>หมวดหมู่</label>
                <select 
                  required
                  value={formData.store_category}
                  onChange={(e) => setFormData({...formData, store_category: e.target.value})}
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {category?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>คำอธิบาย/สโลแกน</label>
                <input 
                  type="text" 
                  placeholder="สโลแกนร้านค้า"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>User ID (เจ้าของร้าน)</label>
                <input 
                  type="text" 
                  placeholder="กรอก UUID ของเจ้าของร้าน"
                  value={formData.user_id}
                  onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                />
              </div>

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
                          {isEditMode && !imageFile ? "เปลี่ยนรูปภาพ" : "ดูรูปภาพ"}
                          <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  ยกเลิก
                </button>
                <button type="submit" className={styles.submitBtn} disabled={uploading}>
                  <span className={styles.saveIcon}>💾</span> 
                  {uploading ? "กำลังบันทึก..." : (isEditMode ? "อัปเดตข้อมูล" : "บันทึกข้อมูล")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}