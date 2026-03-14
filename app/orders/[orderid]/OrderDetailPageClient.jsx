"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/orders/[orderid]/orderDetailPage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function OrderDetailPageClient({ orderid, sel }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  // const [store, setStore] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // // โหลด user
  // useEffect(() => {
  //   supabase.auth.getUser().then(({ data }) => {
  //     setUser(data.user);
  //   });
  // }, []);

  // // โหลด order list
  // useEffect(() => {
  //   if (!user || !orderid) return;

  //   async function loadOrderDetail() {
  //     const { data } = await supabase.auth.getSession();
  //     const token = data.session?.access_token;

  //     const res = await fetch(`/api/orders/${orderid}`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     const result = await res.json();
  //     setOrder(result.order ?? null);
  //   }

  //   loadOrderDetail();
  // }, [user, orderid]);

  // // render ทีหลัง
  // if (user === null) {
  //  return <div className={"nologin"}>โปรดเข้าสู่ระบบ...</div>;
  // }
  // if (!order) {
  //   return <div className="nologin">กำลังโหลดข้อมูลออเดอร์...</div>;
  // }
  // console.log("items : ", order);

  useEffect(() => {
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      setUser(profile);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    async function loadOrders() {
      const { data: orders } = await supabase
        .from("orders")
        .select(
          `
  id,
  stores(id,name,image_url,user_id),
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
        .eq("id", orderid)
        .single();

      setOrders(orders);
    }

    loadOrders();
  }, [user]);
  async function UpdateOrder(orderData) {
    const { error } = await supabase
      .from("orders")
      .update({ status: "finished" })
      .eq("id", orderData.id);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((prev) => ({
      ...prev,
      status: "finished",
    }));

    const { data: walletData, error: walletError } = await supabase
      .from("wallet")
      .select("user_id,balance")
      .eq("user_id", orderData.stores.user_id)
      .single();

    if (walletError) {
      console.log(walletError);
      return;
    }

    const newBalance = walletData.balance + orderData.total_price;

    console.log("walletData", walletData);
    console.log("newBalance", newBalance);
    const { error: walletErr } = await supabase
      .from("wallet")
      .update({ balance: newBalance })
      .eq("user_id", orderData.stores.user_id);

    if (walletErr) {
      console.log(walletErr);
    }
    const { data: tx, error: txErr } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        order_id: orderData.id,
        type: "payment",
        amount: orderData.total_price,
      });

    if (txErr) {
      console.log(txErr);
    }
    console.log("tx:", tx);
  }
  // render ทีหลัง
  //console.log("order", orders);
  if (!user) return <div>กำลังโหลด...</div>;

  if (user.role !== "customer") {
    return <div>ไม่มีสิทธิ์</div>;
  }
  if (!mounted) return null;
  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <Link className={styles.backshop} href="/orders">
          ⬅
        </Link>
        <h1>Order#{orderid}</h1>
      </div>
      <div className={styles.content}>
        <div className={`${styles.status} ${orders.status}bg`}>
          <span>- {orders.status} -</span>
        </div>{" "}
        <div className={styles.detail}>
          <span>
            {" "}
            จากร้าน - <b>{orders.stores?.name}</b>
          </span>
          <h3>Order summmary</h3>
          {orders.orders_details?.map((item, idx) => (
            <div key={idx}>
              <div className={styles.listmenu}>
                <span>
                  {item.quantity} x {item.menus.name}
                </span>
                <span>฿{item.subtotal}</span>
              </div>
              <hr />
            </div>
          ))}
          <div className={styles.total}>
            <span>Total</span>
            <span className={styles.totalprice}>฿{orders.total_price}</span>
          </div>
          {orders.status === "ready" && (
            <button
              className={styles.btnaccept}
              onClick={() => UpdateOrder(orders)}
            >
              รับอาหาร
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
