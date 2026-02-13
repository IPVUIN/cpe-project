"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/orders/[orderid]/orderDetailPage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function OrderDetailPageClient({ orderid }) {
  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);

  // โหลด user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // โหลด order list
  useEffect(() => {
    if (!user || !orderid) return;

    async function loadOrderDetail() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch(`/api/orders/${orderid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      setOrder(result.order ?? null);
    }

    loadOrderDetail();
  }, [user, orderid]);

  // render ทีหลัง
  if (user === null) {
   return <div className={"nologin"}>โปรดเข้าสู่ระบบ...</div>;
  }
  if (!order) {
    return <div className="nologin">กำลังโหลดข้อมูลออเดอร์...</div>;
  }
  console.log("items : ", order);
  return (
    <div className={styles.container}>
      <div className={styles.head}>
         <Link className={styles.backshop} href="/orders">
          ⬅
        </Link>
        <h1>Order#{orderid}</h1>
      </div>
      <div className={styles.content}>
        <div className={`${styles.status} ${styles[order.status]}`}>
          <span>- {order.status} -</span>
        </div>{" "}
        <div className={styles.detail}>
          <h3>Order summmary</h3>
          {order.orders_details.map((item, idx) => (
            <div key={idx}>
              <div className={styles.listmenu}>
                <span>
                  {item.quantity} x {item.menus.name}
                </span>
                <span>{item.subtotal} บาท</span>
              </div>
              <hr />
            </div>
          ))}
          <div className={styles.total}>
            <span>Total</span>
            <span>{order.total_price} บาท</span>
          </div>
        </div>
      </div>
    </div>
  );
}
