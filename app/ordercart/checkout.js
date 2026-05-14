import { supabase } from "@/lib/supabaseClient";
export async function checkout(userId, orderId, totalPrice, router) {
  const { data: wallet } = await supabase
    .from("wallet")
    .select("balance,reserved_balance")
    .single();

  console.log(wallet);
  if (wallet.balance - wallet.reserved_balance < totalPrice) {
    alert("ยอดเงินไม่พอ");
    return;
  }

  // กันเงินไว้ก่อน
  await supabase
    .from("wallet")
    .update({
      reserved_balance: wallet.reserved_balance + totalPrice,
    })
    .eq("user_id", userId);

  // เปลี่ยนสถานะ order
  await supabase.from("orders").update({ status: "active" }).eq("id", orderId);

  await supabase
    .from("order_stores")
    .update({ status: "pending" })
    .eq("order_id", orderId);

  router.push("/orders");

const { data: owner_stores, error } = await supabase
  .from("order_stores")
  .select(`
    id,
    stores(
      users(line_id)
    )
  `)
  .eq("order_id", orderId);

if (error) {
  console.log(error);
  return;
}

const lineIds = [
  ...new Set(
    owner_stores
      .map((item) => item.stores?.users?.line_id)
      .filter(Boolean)
  ),
];

for (const lineId of lineIds) {
  await fetch("/api/line/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: lineId,
      message: "มีออเดอร์เข้ามาใหม่ !!!",
    }),
  });
}
}
