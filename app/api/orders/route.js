import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // 1) รับ token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2) สร้าง supabase client
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

    // 3) ดึง orders (RLS จะกรองให้เอง)
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
  id,
  stores(name,image_url),
  total_price,
  status,
  created_at,
   orders_details(
      quantity,
      subtotal,
      menus(name)
    )
`
      )

      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data });
  } catch (err) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
