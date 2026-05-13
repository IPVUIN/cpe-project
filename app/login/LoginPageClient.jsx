"use client";

import { useState } from "react";
import styles from "@/app/login/loginPage.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ModalReset from "./ModalReset";
//import { startTransition } from "react";

export default function LoginClient() {
  const router = useRouter();
  const [error, setError] = useState("");

  const [showForgot, setShowForgot] = useState(null);
  const [email, setEmail] = useState("");
  async function handleSubmit(e) {
    //
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    // ⭐ Login ฝั่ง client (ถูกต้อง)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
      return;
    }

    // query role จากตาราง users
    const { data: roleData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = roleData.role;
    console.log(role);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const lineId = localStorage.getItem("lineId");
    console.log(lineId);

    if (lineId) {
      await supabase
        .from("users")
        .update({ line_id: lineId })
        .eq("id", user.id);
      localStorage.removeItem("lineId");
      alert("เชื่อม LINE สำเร็จ ✅");
    }

    if (role === "customer") router.push("/");
    if (role === "store_owner") router.push("/HomeStore/");
    if (role === "admin") router.push("/Admin_exchange/");
  }


  return (
    <>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.head}>
            <h1>Welcome!</h1>
            <span>เข้าสู่ระบบเพื่อสั่งอาหาร</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.input}>
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="กรอกอีเมล"
              />
            </div>

            <div className={styles.input}>
              <span>Password</span>
              <input
                name="password"
                type="password"
                required
                placeholder="กรอกรหัสผ่าน"
              />

              <button
                type="button"
                className={styles.forgotPassword}
                onClick={() => setShowForgot(true)}
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}

            <button type="submit" className={styles.btnlogin}>
              Login!
            </button>
          </form>
          <div className={styles.regis}>
            <Link href="/login/register">Register</Link>
          </div>
        </div>
      </div>

      {showForgot && <ModalReset email={email} setEmail={setEmail} setShowForgot={setShowForgot}/>}
    </>
  );
}
