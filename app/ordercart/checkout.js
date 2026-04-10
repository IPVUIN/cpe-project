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
}
