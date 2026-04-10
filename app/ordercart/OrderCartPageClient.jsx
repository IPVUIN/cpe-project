"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/ordercart/orderCartPage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import CartControl from "./CartControl";
import { checkout } from "./checkout";
import { useRouter } from "next/navigation";

export default function OrderCartPageClient() {
  const [user, setUser] = useState(null);
  const [ordersCart, setOrdersCart] = useState(null);
  const [wallet, setWallet] = useState(0);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setMounted(true);
  }, []);
  // โหลด user
  useEffect(() => {
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      setUser(profile);

      const { data: wallet } = await supabase
        .from("wallet")
        .select("*")
        .eq("user_id", auth.user.id)
        .single();
      setWallet(wallet);
    }
    loadUser();
  }, []);

  useEffect(() => {
    async function loadOrdersCart() {
      if (!user) return;
      // 1) หา cart ของ user
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(
          `
        id,
        total_price,
        order_stores (
          id,
          store_id,
          store_total,
          stores(name,image_url),
          orders_details (
            id,
            order_stores_id,
            quantity,
            price,
            subtotal,
            note,
            option,
            menus(name,image_url,price)
          )
        )
      `,
        )
        .eq("user_id", user.id)
        .eq("status", "cart")
        .order("id", { foreignTable: "order_stores" })
        .order("id", { foreignTable: "order_stores.orders_details" })
        .maybeSingle();

      if (orderError) {
        console.log(orderError);
        return;
      }

      setOrdersCart(order);
    }
    loadOrdersCart();
  }, [user]);
  console.log("orderCart", ordersCart);

  // render ทีหลัง
  if (!user) return <div>กำลังโหลด...</div>;

  if (user.role !== "customer") {
    return <div>ไม่มีสิทธิ์</div>;
  }
  if (!mounted) return null;

  return (
    <div>
      <div className={styles.head}>
        <div>
          <h1>🛒 ตะกร้าของฉัน</h1>
          <span>ออเดอร์ในตะกร้า</span>
        </div>

        <div className={styles.top_wallet}>
          <Link href="/wallet" className={styles.wallet_circle}>
            ฿{wallet.balance}
          </Link>
        </div>
      </div>
      <h3>ตะกร้า</h3>
      {(!ordersCart || ordersCart.order_stores?.length === 0) && (
        <div className={styles.nomenu}>ตะกร้าว่างเปล่า</div>
      )}
      {user?.role === "customer" && (
        <>
          {ordersCart?.order_stores?.map((store) => (
            <div className={`${styles.order_cart} pageFade`} key={store.id}>
              <div className={styles.order_cart_head}>
                <div className={styles.divimage}>
                  <Image
                    src={store.stores?.image_url}
                    className={styles.image}
                    fill
                    alt="image_shop"
                  />
                </div>

                <div className={styles.order_cart_head_text}>
                  <h4>{store.stores?.name}</h4>

                  <Link
                    href={"/store/" + store.store_id}
                    className={styles.storelink}
                  >
                    ไปที่ร้าน
                  </Link>

                  <br />
                  <span>อยู่ระหว่างการสั่งซื้อ . . .</span>
                </div>
              </div>

              <div className={styles.order_cart_menus}>
                {store.orders_details?.map(
                  (item) =>
                    item.quantity !== 0 && (
                      <div
                        key={item.id}
                        className={styles.order_cart_menu_single}
                      >
                        <CartControl
                          supabase={supabase}
                          item={item}
                          setOrdersCart={setOrdersCart}
                          ordersCart={ordersCart}
                          storeId={store.id}
                        />
                      </div>
                    ),
                )}
              </div>

              <div className={styles.order_cart_total}>
                <h4>รวม ฿{store.store_total}</h4>
              </div>
            </div>
          ))}
          {ordersCart?.order_stores.length > 0 && (
            <>
              <div className={styles.order_cart_total}>
                <h3>รวมทั้งหมด ฿{ordersCart?.total_price}</h3>
              </div>

              <div className={styles.order_cart_checkout}>
                <button
                  onClick={() =>
                    checkout(
                      user.id,
                      ordersCart.id,
                      ordersCart.total_price,
                      router,
                    )
                  }
                >
                  สั่งซื้อเลย!
                </button>
              </div>
            </>
          )}
        </>
      )}
      {user?.role === "store_owner" ? <div>สั่งไม่ได้</div> : <div></div>}
    </div>
  );
}
