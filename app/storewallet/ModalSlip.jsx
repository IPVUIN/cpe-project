"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./storeWalletPage.module.css";

export default function ModalSlip({
setShowModal,app
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Modal>
      <div className={styles.Modal}>
        <h2>หลักฐานการโอน</h2>
          <button
          onClick={() => setShowModal(false)}
          className={styles.btnClose}
        >
          X
        </button>
        <div className={styles.divimage}>
            <Image src={app.slip_url} fill alt="app" className={styles.imagestore}/>
        </div>
        
      </div>
    </Modal>
  );
}
