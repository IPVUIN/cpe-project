import { NextResponse } from "next/server";
import Omise from "omise";
import { createClient } from "@supabase/supabase-js";

const omise = Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const event = await req.json();

    if (event.key !== "charge.complete") {
      return NextResponse.json({ received: true });
    }

    const chargeId = event.data.id;

    // ตรวจ charge กับ Omise อีกรอบ
    const charge = await omise.charges.retrieve(chargeId);

    if (charge.status !== "successful") {
      return NextResponse.json({ received: true });
    }

    // หา topup
    const { data: topup, error: topupError } = await supabaseAdmin
      .from("topups")
      .select("*")
      .eq("charge_id", chargeId)
      .single();

    if (topupError || !topup) {
      return NextResponse.json({ error: "topup not found" }, { status: 404 });
    }

    // กัน webhook ยิงซ้ำ
    if (topup.status === "success") {
      return NextResponse.json({ received: true });
    }

    // หา wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallet")
      .select("*")
      .eq("user_id", topup.user_id)
      .single();

    if (walletError) throw walletError;

    const newBalance = Number(wallet.balance) + Number(topup.amount);

    // เพิ่มเงินเข้า wallet
    const { error: updateWalletError } = await supabaseAdmin
      .from("wallet")
      .update({ balance: newBalance })
      .eq("user_id", topup.user_id);

    if (updateWalletError) throw updateWalletError;

    // บันทึกประวัติ
    const { error: tranError } = await supabaseAdmin
      .from("wallet_transactions")
      .insert({
        user_id: topup.user_id,
        type: "topup",
        amount: topup.amount,
        // balance_after: newBalance,
        description: "เติมเงินผ่าน Omise Test Mode",
      });

    if (tranError) throw tranError;

    // เปลี่ยน topup เป็น success
    const { error: updateTopupError } = await supabaseAdmin
      .from("topups")
      .update({ status: "success" })
      .eq("id", topup.id);

    if (updateTopupError) throw updateTopupError;

    return NextResponse.json({ received: true });
  } catch (err) {
    console.log("WEBHOOK ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}