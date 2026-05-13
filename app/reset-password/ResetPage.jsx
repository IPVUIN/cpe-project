"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "@/app/reset-password/resetPage.module.css";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
export default function ResetPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const router = useRouter();
  const handleReset = async () => {
    if (password !== confirm) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      alert("เกิดข้อผิดพลาด");
      console.log(error);
    } else {
      alert("เปลี่ยนรหัสผ่านสำเร็จ");
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.resetContainer}>
        <h2>ตั้งรหัสผ่านใหม่</h2>

        <input
          type="password"
          placeholder="รหัสผ่านใหม่"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="ยืนยันรหัสผ่าน"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button onClick={handleReset}>บันทึก</button>
      </div>
    </div>
  );
}
