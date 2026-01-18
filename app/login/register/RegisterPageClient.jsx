"use client";

import styles from "@/app/login/register/registerPage.module.css";
import Link from "next/link";
import registerAction from "./registerAction.js";

export default function RegisterPageClient() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.head}>
          <h1>Register</h1>
          <span>กรอกข้อมูลเพื่อสมัครใช้งาน</span>
        </div>

        <form action={registerAction} className={styles.form}>
          <div className={styles.input}>
            <span>Username</span>
            <input
              name="username"
              type="text"
              required
              placeholder="กรอกชื่อผู้ใช้"
            />
          </div>
          <div className={styles.input}>
            <span>Email</span>
            <input
              type="email"
              name="email"
              id=""
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
              placeholder="กรอกรหัสผ่าน 6 ตัว"
            />
          </div>

          <button type="submit">Register!</button>
        </form>

        <div className={styles.back}>
          <Link href="/login">Back</Link>
        </div>
      </div>
    </div>
  );
}
