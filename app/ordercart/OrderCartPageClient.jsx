"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/ordercart/orderCartPage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
export default function OrderCartPageClient() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersCart, setOrdersCart] = useState(null);
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [balance, setBalance] = useState(0);
  // โหลด user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // โหลด order list
  useEffect(() => {
    if (!user) return;

    async function loadOrders() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      setOrders(Array.isArray(result.orders) ? result.orders : []);
      setOrdersCart(result.cart ? result.cart : null);
      console.log("API RESULT:", result);

      const { data: roleData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(roleData);
    }

    async function loadWallet() {
      const { data, error } = await supabase
        .from("wallet")
        .select("balance")
        .single();

      if (!error) setBalance(data.balance);
    }

    loadWallet();
    loadOrders();
  }, [user]);
  console.log("roleDATA", userRole);
  async function Addmenu(id, qty, price, orderId) {
    const newQty = qty + 1;
    const newSubtotal = newQty * price;

    // 🔥 update UI ทันที

    setOrdersCart((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        orders_details: prev.orders_details.map((it) =>
          it.id === id
            ? {
                ...it,
                quantity: newQty,
                subtotal: newSubtotal,
              }
            : it,
        ),
        total_price: prev.total_price + price,
      };
    });

    // DB ค่อยตามหลัง
    await supabase
      .from("orders_details")
      .update({
        quantity: newQty,
        subtotal: newSubtotal,
      })
      .eq("id", id);
    // console.log("ADDORDER:", addOrder);

    const { data: total, error: totalError } = await supabase
      .from("orders_details")
      .select("subtotal")
      .eq("order_id", orderId);

    if (totalError) {
      alert(totalError.message);
      return;
    }

    const totalsub = total.reduce((sum, row) => sum + row.subtotal, 0);
    const { error: newTotalError } = await supabase
      .from("orders")
      .update({ total_price: totalsub })
      .eq("id", orderId);

    if (newTotalError) {
      alert(newTotalError.message);
      return;
    }
  }

  async function Minusmenu(id, qty, price, orderId) {
    const newQty = qty - 1;
    const newSubtotal = newQty * price;

    // 🔥 update UI ทันที

    setOrdersCart((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        orders_details: prev.orders_details.map((it) =>
          it.id === id
            ? {
                ...it,
                quantity: newQty,
                subtotal: newSubtotal,
              }
            : it,
        ),
        total_price: prev.total_price - price,
      };
    });

    // DB ค่อยตามหลัง
    await supabase
      .from("orders_details")
      .update({
        quantity: newQty,
        subtotal: newSubtotal,
      })
      .eq("id", id);

    const { data: total, error: totalError } = await supabase
      .from("orders_details")
      .select("subtotal")
      .eq("order_id", orderId);

    if (totalError) {
      alert(totalError.message);
      return;
    }

    const totalsub = total.reduce((sum, row) => sum + row.subtotal, 0);
    const { error: newTotalError } = await supabase
      .from("orders")
      .update({ total_price: totalsub })
      .eq("id", orderId);

    if (newTotalError) {
      alert(newTotalError.message);
      return;
    }
  }

  async function Delmenu(id, price, orderId) {
    // setOrdersCart((prev) =>

    //   prev.map((cart) =>
    //     cart.id !== orderId
    //       ? cart
    //       : {
    //           ...cart,
    //           orders_details: cart.orders_details.filter((it) => it.id !== id),
    //           total_price: cart.total_price - price,
    //         },
    //   ),
    // );

    setOrdersCart((prev) => {
      if (!prev) return prev;

      const nextItems = prev.orders_details.filter((it) => it.id !== id);

      if (nextItems.length === 0) return null;

      return {
        ...prev,
        orders_details: nextItems,
        total_price: prev.total_price - price,
      };
    });

    const { data: delMenu, error: delMenuError } = await supabase
      .from("orders_details")
      .delete()
      .eq("id", id);
    if (delMenuError) {
      alert(delMenuError.message);
      return;
    }

    const { data: checkMenu, error: checkMenuError } = await supabase
      .from("orders_details")
      .select("id")
      .eq("order_id", orderId)
      .limit(1);

    if (checkMenuError) return alert(checkMenuError.message);

    if (checkMenu.length === 0) {
      const { error: delOrderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (delOrderError) return alert(delOrderError.message);
    }

    const { data: total, error: totalError } = await supabase
      .from("orders_details")
      .select("subtotal")
      .eq("order_id", orderId);

    if (totalError) {
      alert(totalError.message);
      return;
    }

    const totalsub = total.reduce((sum, row) => sum + row.subtotal, 0);
    const { error: newTotalError } = await supabase
      .from("orders")
      .update({ total_price: totalsub })
      .eq("id", orderId);

    if (newTotalError) {
      alert(newTotalError.message);
      return;
    }
  }
  // 1) realtime orders (status, total_price)

  // 2) realtime orders_details (quantity, subtotal)
  // useEffect(() => {
  //   if (!user) return;
  //   const orderIds = ordersCart.map((o) => o.id).join(",");
  //   const ch = supabase
  //     .channel("rt-order-details")
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "UPDATE",
  //         schema: "public",
  //         table: "orders_details",
  //         //  filter: `order_id=in.(${orderIds})`,
  //       },
  //       (payload) => {
  //         const d = payload.new;

  //         setOrdersCart((prev) =>
  //           prev.map((cart) => {
  //             if (cart.id !== d.order_id) return cart;

  //             return {
  //               ...cart,
  //               orders_details: cart.orders_details.map((it) =>
  //                 it.id === d.id
  //                   ? {
  //                       ...it,
  //                       quantity: d.quantity,
  //                       subtotal: d.subtotal,
  //                     }
  //                   : it,
  //               ),
  //             };
  //           }),
  //         );
  //       },
  //     )

  //     .subscribe();

  //   return () => supabase.removeChannel(ch);
  // }, [user]);

  async function checkout() {
    // ตอนนี้เครื่องเรามี session ของคนที่ล็อกอินอยู่ไหม?
    const { data } = await supabase.auth.getSession();
    // ดึง token ออกมาใช้
    const accessToken = data.session?.access_token;

    // เรียก API  API Route
    const res = await fetch("/api/checkout", {
      // POST ใช้ “ส่งข้อมูล”
      method: "POST",
      headers: {
        // ข้อมูลที่ส่งไปเป็น JSON
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      // คือข้อมูลหลักที่ส่งไปให้ server
      body: JSON.stringify({ order_id: ordersCart?.id }), // ส่ง cart
    });
    const result = await res.json();
    console.log("result", result);
    if (result.ok) {
      alert("สั่งซื้อสำเร็จ");
      router.push("/orders");
    } else {
      alert(result.error || "เกิดข้อผิดพลาดในการสั่งซื้อ");
    }
  }

  // render ทีหลัง
  if (user === null) {
    return <div className={"nologin"}>โปรดเข้าสู่ระบบ...</div>;
  }
  console.log("order", orders);
  console.log("orderCart", ordersCart);
  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <div>
          <h1>🍔 My Cart</h1>
          <span>All orders</span>
        </div>

        <div className={styles.top_wallet}>
          <Link href="/wallet" className={styles.wallet_circle}>
            {balance} บาท
          </Link>
        </div>
      </div>
      <h3>ตะกร้า</h3>
      {!ordersCart && <div className={styles.nomenu}>ตะกร้าว่างเปล่า</div>}
      {userRole?.role === "customer" && (
        <>
          {ordersCart?.stores && (
            <div
              className={`${styles.order_cart} pageFade`}
              key={ordersCart.id}
            >
              <div className={styles.order_cart_head}>
                <div className={styles.divimage}>
                  <Image
                    src={ordersCart.stores.image_url}
                    className={styles.image}
                    fill
                    alt="image_shop"
                  />
                </div>
                <div className={styles.order_cart_head_text}>
                  <h4>{ordersCart.stores.name}</h4>
                  <Link
                    href={"/store/" + ordersCart.stores.id}
                    className={styles.storelink}
                  >
                    ไปที่ร้าน
                  </Link>
                  <br />
                  <span>อยู่ระหว่างการสั่งซื้อ . . .</span>
                </div>
              </div>

              <div className={styles.order_cart_menus}>
                {ordersCart.orders_details.map((item, idx) =>
                  item.quantity !== 0 ? (
                    <div key={idx} className={styles.order_cart_menu_single}>
                      <span className={styles.order_cart_menu}>
                        {item.menus.name} x{item.quantity}
                        <div className={styles.order_cart_menu_end}>
                          {" "}
                          <span>{item.subtotal} บาท</span>
                          {item.quantity > 1 ? (
                            <button
                              onClick={() =>
                                Minusmenu(
                                  item.id,
                                  item.quantity,
                                  item.menus.price,
                                  ordersCart.id,
                                )
                              }
                              className={styles.minus}
                            >
                              -
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                Delmenu(
                                  item.id,
                                  item.menus.price,
                                  ordersCart.id,
                                )
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
                              Addmenu(
                                item.id,
                                item.quantity,
                                item.menus.price,
                                ordersCart.id,
                              )
                            }
                            className={styles.add}
                          >
                            +
                          </button>
                        </div>
                      </span>
                    </div>
                  ) : null,
                )}
              </div>

              <div className={styles.order_cart_total}>
                <h4>ราคารวม {ordersCart.total_price} บาท</h4>
              </div>

              <div className={styles.order_cart_checkout}>
                <button onClick={checkout}>Checkout!</button>
              </div>
            </div>
          )}
          <hr />
          {/* <div className={styles.order}>
        <h3>สั่งสำเร็จ</h3>
        {orders.length === 0 && (
          <div className={styles.nomenu}>ยังไม่มีคำสั่งซื้อ</div>
        )}
        {orders?.map((order) => (
          <Link
            href={"/order/" + order.id}
            className={styles.order_card}
            key={order.id}
          >
            <div className={styles.divimage}>
              <Image
                src={order.stores.image_url}
                className={styles.image}
                fill
                alt="image_shop"
              />
            </div>

            <div className={styles.order_card_text}>
              <div className={styles.order_card_head}>
                <div>
                  <h4>{order.stores.name}</h4>
                  <span>
                    {new Date(order.created_at).toLocaleString("th-TH", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}{" "}
                    - Order#{order.id}
                  </span>
                </div>
                <div
                  className={`${styles.order_status} ${styles[order.status]}`}
                >
                  {order.status}
                </div>
              </div>

              <div className={styles.order_card_menus}>
                {order.orders_details.map((item, idx) => (
                  <span key={idx}>
                    {item.quantity}x {item.menus.name}
                    {idx !== order.orders_details.length - 1 && ", "}
                  </span>
                ))}
              </div>
              <div className={styles.order_card_price}>
                <h4>{order.total_price} บาท</h4>
              </div>
            </div>
          </Link>
        ))}
      </div> */}
        </>
      )}
      {userRole?.role === "store_owner" ? <div>สั่งไม่ได้</div> : <div></div>}
    </div>
  );
}
