"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/order/orderPage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function OrderPageClient() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

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

  // realtime order status
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Realtime update:", payload.new);

          setOrders((prev) =>
            prev.map((order) =>
              order.id === payload.new.id
                ? { ...order, status: payload.new.status }
                : order
            )
          );
          if (payload.new.status === "finished") {
            alert(`🍔 Order ที่่ ${payload.new.id} พร้อมแล้ว!`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      </div>
    </div>
  );
}
