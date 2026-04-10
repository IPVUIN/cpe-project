"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./EditModal.module.css";
import { supabase } from "@/lib/supabaseClient";

export default function AddCate({
  setShowModalCate,
  menuCate,
  setMenuCate,
  addNameCate,
  setAddNameCate,
  handleAddCate,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleDeleteCate(mc) {
    if (mc.menus?.length > 0) {
      alert("หมวดนี้มีเมนูอยู่ ลบไม่ได้");
      return;
    }
    const confirmDelete = confirm("ต้องการลบหมวดหมู่นี้ใช่ไหม?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("menu_category")
      .delete()
      .eq("id", mc.id);

    if (error) {
      alert(error.message);
      return;
    }

    // update UI ทันที
    setMenuCate((prev) => prev.filter((c) => c.id !== mc.id));
  }
  console.log(menuCate);
  if (!mounted) return null;

  return (
    <Modal>
      <div className={styles.Modal}>
        <h2>เพิ่มหมวดหมู่</h2>
        <button
          onClick={() => setShowModalCate(false)}
          className={styles.btnClose}
        >
          X
        </button>
        <div className={styles.menucate_div}>
          <span >หมวดหมู่ที่มีอยู่ - {menuCate?.length || 0} รายการ</span>
          <div className={styles.menucate_sec}>
             {menuCate.map((mc) => (
            <div key={mc.id} className={styles.menucate}>
             <span>{mc.name} - <span style={{opacity:"50%"}}>{mc.menus.length} เมนู</span></span> 
              <button onClick={() => handleDeleteCate(mc)} className="cancel">ลบ</button>
            </div>
          ))}
          </div>
         
        </div>
        <div className={styles.menucateadd}>
          <input
            type="text"
            value={addNameCate}
            onChange={(e) => setAddNameCate(e.target.value)}
            placeholder="กรอกหมวดหมู่"
          />
          <button onClick={handleAddCate}>เพิ่มหมวดหมู่</button>
        </div>
      </div>
    </Modal>
  );
}
