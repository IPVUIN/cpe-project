"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./EditModal.module.css";

export default function AddCate({
  setShowModalCate,
  menuCate,
  addNameCate,
  setAddNameCate,handleAddCate
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <div>
          <h4>หมวดหมู่ที่มีอยู่</h4>
          {menuCate.map((mc) => (
            <div key={mc.id} className={styles.menucate}>
              {mc.name}
            </div>
          ))}
        </div>
        <div className={styles.menucateadd}>
          <input  type="text"
              value={addNameCate}
              onChange={(e) => setAddNameCate(e.target.value)} placeholder="กรอกหมวดหมู่" />
          <button onClick={handleAddCate}>เพิ่มหมวดหมู่</button>
        </div>
      </div>
    </Modal>
  );
}
