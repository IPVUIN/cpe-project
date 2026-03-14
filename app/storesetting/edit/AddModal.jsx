"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./EditModal.module.css";

export default function AddModal({
  setShowModalAdd,
  menuCate,
  addName,
  setAddName,
  addPrice,
  setAddPrice,
  addCategory,
  setAddCategory,
  handleAddMenu,setSelectedFile
  //   editName,
  //   setEditName,
  //   editPrice,
  //   setEditPrice,
  //   editCategory,
  //   setEditCategory,
  //   menuCate,
  //   editImage,
  //   handleUpdate,
  //   setShowModal,
  //   setSelectedFile
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [menuPreview, setMenuPreview] = useState(null);

  function handleMenuImageAdd(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setMenuPreview(URL.createObjectURL(file));
  }
  if (!mounted) return null;

  return (
    <Modal>
      <div className={styles.Modal}>
        <h2>เพิ่มเมนู</h2>
        <button
          onClick={() => setShowModalAdd(false)}
          className={styles.btnClose}
        >
          X
        </button>
        <div className={styles.inputMenu}>
          <span>ชื่อเมนู</span>
          <input value={addName} onChange={(e) => setAddName(e.target.value)}  placeholder="กรอกชื่อเมนู" />
        </div>
        <div className={styles.priceCat}>
          <div className={styles.inputMenu}>
            <span> ราคา</span>
            <input
              type="number"
              value={addPrice}
              onChange={(e) => setAddPrice(e.target.value)}
              placeholder="กรอกราคา"
            />
          </div>

          <div className={styles.inputMenu}>
            <span>หมวดหมู่อาหาร</span>{" "}
            <select
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
            >
              <option value={null}>เลือกหมวดหมู่</option>

              {menuCate?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.inputMenu}>
          <span>รูปภาพ</span>

          <div className={styles.divImage}>
            <Image
              src={menuPreview || "/cutlery.png"}
              alt="preview"
              fill
              className={styles.imageMenu}
            />
          </div>
        </div>
        <input
          type="file"
          onChange={handleMenuImageAdd}
          className={styles.inputFile}
        />{" "}
        <div className={styles.bottom}>
          <button onClick={handleAddMenu} className={styles.btnSave}>
            บันทึก
          </button>
        </div>
      </div>
    </Modal>
  );
}
