"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/ordercart/orderCartPage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import CartControl from "./CartControl";

export default function OrderCartPageClient() {
  const [user, setUser] = useState(null);
  const [ordersCart, setOrdersCart] = useState(null);
  const router = useRouter();
  const [wallet, setWallet] = useState(0);
  const [mounted, setMounted] = useState(false);

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
            quantity,
            price,
            subtotal,
            menus(name,image_url,price)
          )
        )
      `,
        )
        .eq("user_id", user.id)
        .eq("status", "cart")
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

  async function loadOrders() {
    const { data, error } = await supabase
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
          quantity,
          price,
          subtotal,
          menus(name,image_url,price)
        )
      )
    `,
      )
      .eq("user_id", user?.id)
      .eq("status", "cart")
      .maybeSingle();

    if (error) {
      console.log(error);
      return;
    }

    setOrdersCart(data);
  }
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
          <h1>🍔 My Cart</h1>
          <span>All orders</span>
        </div>

        <div className={styles.top_wallet}>
          <Link href="/wallet" className={styles.wallet_circle}>
            ฿{wallet.balance}
          </Link>
        </div>
      </div>
      <h3>ตะกร้า</h3>
      {!ordersCart && <div className={styles.nomenu}>ตะกร้าว่างเปล่า</div>}
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
                {store.orders_details?.map((item) =>
                  item.quantity !== 0 ? (
                    <div
                      key={item.id}
                      className={styles.order_cart_menu_single}
                    >
                      <CartControl
                        supabase={supabase}
                        item={item}
                        loadOrders={loadOrders}
                      />
                      {/* {item.quantity > 1 ? (
                            <button
                              onClick={() =>
                                Minusmenu(
                                  item.id,
                                  item.quantity,
                                  item.menus.price,
                                )
                              }
                              className={styles.minus}
                            >
                              -
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                Delmenu(item.id, item.menus.price, store.id)
                              }
                              className={styles.del}
                            >
                              <div className={styles.divDel}>
                                <Image
                                  src="/trash.png"
                                  className={styles.image}
                                  fill
                                  alt="image_del"
                                />
                              </div>
                            </button>
                          )}

                          <button
                            onClick={() =>
                              Addmenu(item.id, item.quantity, item.menus.price)
                            }
                            className={styles.add}
                          >
                            +
                          </button> */}
                    </div>
                  ) : null,
                )}
              </div>

              <div className={styles.order_cart_total}>
                <h4>
                  รวมร้านนี้ {store.store_total}
                  บาท
                </h4>
              </div>
            </div>
          ))}
          {ordersCart && (
            <>
              <div className={styles.order_cart_total}>
                {/* <h3>รวมทั้งหมด {ordersCart?.total_price} บาท</h3> */}
              </div>

              <div className={styles.order_cart_checkout}>
                <button
                // onClick={()=>checkout(
                //   user.id,
                //   ordersCart.id,
                //   ordersCart.total_price,
                // )}
                >
                  Checkout!
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
