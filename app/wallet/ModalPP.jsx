"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./ModalPP.module.css";

export default function ModalTran({
  setModalPP,
  loading,
  qr,
  topupId,
  setTopupId,
  setQr,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cancelTopup = async () => {
    if (!topupId) return;

    await fetch("/api/topup/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: topupId }),
    });

    // reset UI
    setQr(null);
    setTopupId(null);
  };
  if (!mounted) return null;

  return (
    <Modal>
      {loading && <p>กำลังสร้าง QR...</p>}

      {qr && (
        <div className={styles.qrContainer}>
          <h3 className={styles.qrTitle}>สแกนเพื่อเติมเงิน</h3>

          <img src={qr} alt="QR" className={styles.qrImage} />

          <p className={styles.qrStatus}>สถานะ: รอชำระเงิน</p>

          <button
            className={styles.cancelBtn}
            onClick={() => {
              cancelTopup();
              setModalPP(false);
            }}
          >
            ยกเลิก
          </button>
        </div>
      )}
    </Modal>
  );
}
