"use client";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import styles from "./Modal.module.css";

export default function Modal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>{children}</div>
    </div>,
    document.body,
  );
}
