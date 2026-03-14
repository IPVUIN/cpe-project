"use server";

import { createClient } from '@supabase/supabase-js';

// เปลี่ยนมารับเป็น Object Data (เพื่อให้เข้ากับหน้าเว็บ React ที่ส่งมา)
export async function createNewUserByAdmin(data) {
  const { username, email, password, role } = data;

  // 1) ใช้ Service Role Key เพื่อสร้างผู้ใช้แบบเงียบๆ (ไม่เตะแอดมินออก)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 2) สร้างบัญชีในระบบ Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // บังคับยืนยันอีเมลให้เลย
    });

    if (authError) {
      console.log("AUTH ERROR:", authError);
      throw new Error("สร้างบัญชีไม่สำเร็จ: " + authError.message);
    }

    const newUserId = authData.user.id;

    // 3) Insert ไปที่ตาราง users
    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: newUserId,
      username: username,
      email: email.toLowerCase(),
      role: role // บันทึก Role ด้วย
    });

    if (userError) {
      console.log("INSERT USER ERROR:", userError);
      throw new Error("เพิ่มข้อมูลผู้ใช้ไม่สำเร็จ");
    }

    // 4) Insert ไปที่ตาราง wallet
    const { error: walletError } = await supabaseAdmin.from("wallet").insert({
      user_id: newUserId,
      balance: 0,
    });

    if (walletError) {
      console.log("INSERT WALLET ERROR:", walletError);
      throw new Error("สร้างกระเป๋าเงินไม่สำเร็จ");
    }

    // 5) ส่งผลลัพธ์ว่าสำเร็จกลับไป (ไม่ต้อง Redirect)
    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}