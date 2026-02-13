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
      },
    );

    const { data: orders_cart, error: orders_cart_error } = await supabase
      .from("orders")
      .select(
        `
  id,
  stores(id,name,image_url),
  total_price,
  status,
  created_at,
   orders_details(
      id,
      quantity,
      subtotal,
      menus(
        name,
        price
      )
    )
`,
      )
      .eq("status", "cart")
      .maybeSingle();
    // .order("created_at", { ascending: false });

    if (orders_cart_error) {
      return NextResponse.json(
        { error: orders_cart_error.message },
        { status: 500 },
      );
    }

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
`,
      )

      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data, cart: orders_cart });
  } catch (err) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
