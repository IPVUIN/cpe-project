"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "@/app/login/loginPage.module.css";
import { supabase } from "@/lib/supabaseClient";

export default function ModalReset({ email, setEmail, setShowForgot }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const handleForgotPassword = async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://ctpay-delta.vercel.app/reset-password",
    });

    console.log("data:", data);
    console.log("error:", error);

    if (error) {
      alert(error.message);
      return;
    }
    alert("ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว");
  };
  console.log(email);
  if (!mounted) return null;
  return (
    <Modal>
      <div className={styles.overlay}>
        <div className={styles.contents}>
          <h2>ลืมรหัสผ่าน</h2>
          <p>กรอกอีเมลของคุณเพื่อรับลิงก์ตั้งรหัสผ่านใหม่</p>

          <input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className={styles.actions}>
            <button onClick={handleForgotPassword}>
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </button>
            <button onClick={() => setShowForgot(false)}>ยกเลิก</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
