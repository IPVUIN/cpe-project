import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = await params;
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

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
    const orderId = Number(id);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
    id,
    status,
    orders_details(
      quantity,
      price,
      subtotal,
      menus(name)
    ),
    total_price
  `
      )
      .eq("id", orderId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: data });
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
