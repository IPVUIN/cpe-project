"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/orders/orderPage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bruno_Ace, Cal_Sans } from "next/font/google";
export default function OrderCartPageClient() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
 // const [ordersCart, setOrdersCart] = useState(null);

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
      console.log("API RESULT:", result);
    }

    loadOrders();
  }, [user]);



  // render ทีหลัง
  if (user === null) {
    return <div className={"nologin"}>โปรดเข้าสู่ระบบ...</div>;
  }
  console.log("order", orders);
  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <h1>🍔 My order</h1>
        <span>All orders</span>
      </div>

     
      <div className={styles.order}>
        <h3>สั่งสำเร็จ</h3>
        {orders.length === 0 && (
          <div className={styles.nomenu}>ยังไม่มีคำสั่งซื้อ</div>
        )}
        {orders?.map((order) => (
          <Link
            href={"/orders/" + order.id}
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
      </div>
    </div>
  );
}
