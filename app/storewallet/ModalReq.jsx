"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./storeWalletPage.module.css";

export default function ModalReq({
  setModalReq,
  editBank,
  setEditBank,
  bank,
  editName,
  setEditName,
  editNumber,
  setEditNumber,
  editAmount,
  setEditAmount,
  handleRequest,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Modal>
      <div className={styles.request}>
        <button onClick={() => setModalReq(false)} className={styles.btnClose}>
          X
        </button>

        <h3>📩 สร้างคำขอถอนเงิน</h3>
        <div className={styles.request_bank}>
          <span>ธนาคารปลายทาง</span>
          <select
            value={editBank}
            onChange={(e) => setEditBank(e.target.value)}
          >
            <option value="">-- เลือกธนาคาร --</option>
            {bank?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.request_bank_detail}>
          <div>
            <span>ชื่อบัญชี</span>
            <input
              type="text"
              placeholder="ชื่อ-นามสกุล"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>{" "}
          <div>
            <span>เลขที่บัญชี</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="กรอกเป็นตัวเลข"
              value={editNumber}
              onChange={(e) => setEditNumber(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>
        <div className={styles.request_amount}>
          <span>จำนวนเงิน</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="ระบุจำนวนเงิน"

            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className={styles.request_amount_under}>

        </div>
        <button onClick={handleRequest} className={styles.btn_req}>
          ยืนยันคำขอ
        </button>
      </div>
    </Modal>
  );
}
