"use server"; // จำเป็นสำหรับ Next.js App Router เพื่อบอกว่าเป็น Server Action

import { createClient } from '@supabase/supabase-js';

export async function createNewUserByAdmin(data) {
  const { username, email, password, role } = data;

  // 1) ใช้ Service Role Key เพื่อสร้างผู้ใช้แบบเงียบๆ
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
      email_confirm: true,
    });

    if (authError) throw new Error("สร้างบัญชีไม่สำเร็จ: " + authError.message);

    const newUserId = authData.user.id;

    // 3) Insert ไปที่ตาราง users
    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: newUserId,
      username: username,
      email: email.toLowerCase(),
      role: role 
    });

    if (userError) throw new Error("เพิ่มข้อมูลผู้ใช้ไม่สำเร็จ");

    // 4) Insert ไปที่ตาราง wallet
    const { error: walletError } = await supabaseAdmin.from("wallet").insert({
      user_id: newUserId,
      balance: 0,
    });

    if (walletError) throw new Error("สร้างกระเป๋าเงินไม่สำเร็จ");

    // ⭐️ 5) ส่งผลลัพธ์พร้อม userId กลับไปเพื่อเอาไปสร้างร้านต่อ
    return { success: true, userId: newUserId };

  } catch (error) {
    return { success: false, error: error.message };
  }
}