"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./EditModal.module.css";

export default function EditModal({
  editName,
  setEditName,
  editPrice,
  setEditPrice,
  editCategory,
  setEditCategory,
  menuCate,
  editImage,
  handleUpdate,
  setShowModal,
  setSelectedFile
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [menuPreview, setMenuPreview] = useState(null);

  function handleMenuImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setMenuPreview(URL.createObjectURL(file));
  }
  if (!mounted) return null;

  return (
    <Modal>
      <div className={styles.Modal}>
        <h2>แก้ไขเมนู</h2>
        <button onClick={() => setShowModal(false)} className={styles.btnClose}>
          X
        </button>
        <div className={styles.inputMenu}>
          <span>ชื่อเมนู</span>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </div>
        <div className={styles.priceCat}>
          <div className={styles.inputMenu}>
            <span> ราคา</span>
            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
            />
          </div>

          <div className={styles.inputMenu}>
            <span>หมวดหมู่อาหาร</span>{" "}
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
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
              src={menuPreview || editImage || "/cutlery.png"}
              alt="preview"
              fill
              className={styles.imageMenu}
            />
          </div>
        </div>
        <input
          type="file"
          onChange={handleMenuImage}
          className={styles.inputFile}
        />{" "}
        <div className={styles.bottom}>
          <button onClick={handleUpdate} className={styles.btnSave}>
            บันทึกการแก้ไข
          </button>
        </div>
      </div>
    </Modal>
  );
}
