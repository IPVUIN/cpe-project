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
      },
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
    const { order_id } = await req.json();
    if (!order_id) {
      return NextResponse.json({ error: "missing order_id" }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        `
        id, user_id, status, store_id,
        orders_details (
          id, menu_id, quantity, subtotal
        )
      `,
      )
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();
    console.log("order:", order);
    if (orderErr || !order) {
      return NextResponse.json({ error: "order not found" }, { status: 404 });
    }

    const menuIds = order.orders_details.map((it) => it.menu_id);

    const { data: menus, error: menusErr } = await supabase
      .from("menus")
      .select("id, price, name")
      .in("id", menuIds);
    console.log("menus:", menus);
    if (menusErr) {
      return NextResponse.json({ error: "cannot load menus" }, { status: 500 });
    }

    const priceById = new Map(menus.map((m) => [m.id, m.price]));
    console.log("priceById:", priceById);
    let total = 0;
    for (const it of order.orders_details) {
      const price = priceById.get(it.menu_id);
      if (price == null) {
        return NextResponse.json({ error: "menu not found" }, { status: 400 });
      }
      if (it.quantity <= 0) {
        return NextResponse.json(
          { error: "invalid quantity" },
          { status: 400 },
        );
      }
      total += price * it.quantity;
    }
    console.log("total:", total);

    const { data: wallet, error: walletErr } = await supabase
      .from("wallet")
      .select("id, balance")
      .eq("user_id", user.id)
      .single();

    if (walletErr || !wallet) {
      return NextResponse.json({ error: "wallet not found" }, { status: 404 });
    }
    console.log("wallet:", wallet);

    if (wallet.balance <= total) {
      return NextResponse.json({ error: "ยอดเงินไม่พอ" }, { status: 400 });
    }

    const { data: updatedWallet, error: updErr } = await supabase
      .from("wallet")
      .update({ balance: wallet.balance - total })
      .eq("id", wallet.id)
      .gte("balance", total)
      .select("id, balance")
      .single();

    if (updErr || !updatedWallet) {
      return NextResponse.json(
        { error: "ยอดเงินไม่พอหรือหักเงินไม่สำเร็จ" },
        { status: 400 },
      );
    }
    console.log("updatedWallet:", updatedWallet);

    const { data: tx, error: txErr } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        order_id: order.id,
        type: "payment",
        amount: total,
      });

    if (txErr) {
      return NextResponse.json(
        { error: "cannot create transaction" },
        { status: 500 },
      );
    }
    console.log("tx:", tx);

    const { error: orderUpErr } = await supabase
      .from("orders")
      .update({
        total_price: total,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("user_id", user.id);

    if (orderUpErr) {
      return NextResponse.json(
        { error: "cannot update order" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
