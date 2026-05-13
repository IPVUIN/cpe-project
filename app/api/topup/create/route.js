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
    const { amount, user_id } = await req.json();

    if (!amount || !user_id) {
      return NextResponse.json({ error: "missing data" }, { status: 400 });
    }

    const charge = await omise.charges.create({
      amount: amount * 100,
      currency: "thb",
      source: {
        type: "promptpay",
      },
    });

    const qrUrl = charge.source.scannable_code.image.download_uri;

    const { data, error } = await supabaseAdmin
      .from("topups")
      .insert({
        user_id,
        amount,
        status: "pending",
        charge_id: charge.id,
        qr_url: qrUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      topup_id: data.id,
      qr_url: qrUrl,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { error: "create topup failed" },
      { status: 500 }
    );
  }
}