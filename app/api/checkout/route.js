import { createClient } from "@supabase/supabase-js";
import { Oregano } from "next/font/google";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // (ตรวจสอบตัวตนผู้ใช้)
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    // ถ้าไม่มี token → ปฏิเสธทันที
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // สร้าง Supabase client ที่ “ผูกกับผู้ใช้คนนี้”
    // ทุก query หลังจากนี้จะผ่าน RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // ตรวจสอบว่า token นี้เป็นของ user จริง
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // กัน token ปลอม
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // รับรายการสินค้าที่ผู้ใช้เลือก
    const { cart } = await req.json();
    //console.log("cart : ", cart);

    // cart ต้องเป็น array และไม่ว่าง
    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "cart ไม่ถูกต้อง" }, { status: 400 });
    }

    // ดึง menu_id ทั้งหมดจาก cart
    const menuIds = cart.map((item) => item.id);
    //console.log("menuIds : ", menuIds);

    // ดึงราคาจริงจาก DB
    const { data: menus, error: menuError } = await supabase
      .from("menus")
      .select("id, store_id, price")
      .in("id", menuIds);
    console.log(menus);
    // กันกรณี client ส่ง menu_id มั่ว
    if (menuError || !menus || menus.length === 0) {
      return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 400 });
    }

    // ตรวจว่าเมนูทั้งหมดอยู่ร้านเดียวกันหรือไม่
    const storeIds = [...new Set(menus.map((m) => m.store_id))];
    //console.log("storeIds : ", storeIds);

    // บังคับกติกาของระบบ (1 order = 1 store)
    if (storeIds.length > 1) {
      return NextResponse.json(
        { error: "ไม่สามารถสั่งหลายร้านในออเดอร์เดียว" },
        { status: 400 }
      );
    }

    const storeId = storeIds[0];
    // console.log("storeID : ", storeId);

    // คำนวณยอดรวม (server)
    const menuMap = new Map();
    menus.forEach((m) => {
      menuMap.set(m.id, m.price);
    });
    //console.log("menuMap : ", menuMap);
    const total = cart.reduce((sum, item) => {
      const price = menuMap.get(item.id);
      console.log("price : ", price);
      return sum + price * item.qty;
    }, 0);
    //console.log("total : ", total);

    // ดึงยอดเงินของผู้ใช้
    const { data: wallet, error: walletError } = await supabase
      .from("wallet")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: "ไม่พบ wallet" }, { status: 400 });
    }

    // ป้องกันยอดติดลบ
    if (wallet.balance < total) {
      return NextResponse.json({ error: "เงินไม่พอ" }, { status: 400 });
    }

    // สร้างรายการสั่งซื้อหลัก
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_price: total,
        store_id: storeId,
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json(
        {
          error: " order error",
          //   error: orderError.message,
          //   details: orderError.details,
          //   hint: orderError.hint,
          //   code: orderError.code,
        },
        { status: 500 }
      );
    }

    // แยกรายการสินค้าแต่ละรายการ
    const orderDetails = cart.map((item) => {
      const price = menuMap.get(item.id);
      return {
        order_id: order.id,
        menu_id: item.id,
        quantity: item.qty,
        price: price,
        subtotal: price * item.qty,
      };
    });

    const { error: orderDetailsError } = await supabase
      .from("orders_details")
      .insert(orderDetails);

    if (orderDetailsError) {
      return NextResponse.json(
        {
          error: " order error",
          //   error: itemsError.message,
          //   details: itemsError.details,
          //   hint: itemsError.hint,
          //   code: itemsError.code,
        },
        { status: 500 }
      );
    }

    // หักเงินหลังจาก order สำเร็จ
    const { error: updateWalletError } = await supabase
      .from("wallet")
      .update({ balance: wallet.balance - total })
      .eq("user_id", user.id);
    if (updateWalletError) {
      return NextResponse.json({ error: "หักเงินไม่สำเร็จ" }, { status: 500 });
    }

    const { error: insertWtError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        order_id: order.id,
        amount: total,
        description: "จ่ายค่าอาหาร",
        type: "payment",
      });
      if (insertWtError) {
      return NextResponse.json({ error: "สร้างรายการธุรกรรมไม่สำเร็จ" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, order_id: order.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
