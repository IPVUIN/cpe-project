import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { id } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("topups")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: "cancel failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}