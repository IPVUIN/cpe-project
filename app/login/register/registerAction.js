"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
export default async function registerAction(formData) {
  const username = formData.get("username");
  const email = formData.get("email").toLowerCase();
  const password = formData.get("password");

  // 1) สมัครใน Supabase Auth
  const { data, error } = await supabaseServer.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.log("AUTH ERROR:", error);
    throw new Error("สมัครไม่สำเร็จ: " + error.message);
  }

  // 2) Insert ไปที่ตาราง users
  const insert = await supabaseServer.from("users").insert({
    id: data.user.id, // ใช้ uuid จาก auth.users
    username: username,
    email: email,
  });
  const insert_wallet = await supabaseServer.from("wallet").insert({
    user_id: data.user.id,
    balance: 0,
  });

  if (insert.error) {
    console.log("INSERT ERROR:", insert.error);
    throw new Error("เพิ่มข้อมูลผู้ใช้ไม่สำเร็จ");
  }
  console.log("INSERT :", insert);
    redirect("/login");
  // 3) Redirect หลังสมัครสำเร็จ
  return { success: true };
}
