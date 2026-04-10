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
        total_price,
        created_at,
        order_stores (
          id,
          store_id,
          order_id,
          store_total,
          stores(name,image_url,user_id),
          status,
          orders_details (
            id,
            order_stores_id,
            quantity,
            price,
            subtotal,
            note,
            option,
            menus(name,price)
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
  console.log(orders);
  async function UpdateOrder(orderData, storeOrder) {
    console.log("orderData", orderData);
    console.log("storeOrder", storeOrder);
    // const { error } = await supabase
    //   .from("orders")
    //   .update({ status: "finished" })
    //   .eq("id", orderData.id);

    // if (error) {
    //   alert(error.message);
    //   return;
    // }

    // setOrders((prev) => ({
    //   ...prev,
    //   status: "finished",
    // }));

    const { data: walletData, error: walletError } = await supabase
      .from("wallet")
      .select("user_id,balance")
      .eq("user_id", storeOrder.stores.user_id)
      .maybeSingle();

    if (walletError) {
      console.log(walletError);
      return;
    }
    console.log("walletData", walletData);
    const newBalance = walletData.balance + orderData.total_price;

    // console.log("walletData", walletData);
    // console.log("newBalance", newBalance);
    // const { error: walletErr } = await supabase
    //   .from("wallet")
    //   .update({ balance: newBalance })
    //   .eq("user_id", orderData.stores.user_id);

    // if (walletErr) {
    //   console.log(walletErr);
    // }
    // const { data: tx, error: txErr } = await supabase
    //   .from("wallet_transactions")
    //   .insert({
    //     user_id: user.id,
    //     order_id: orderData.id,
    //     type: "payment",
    //     amount: orderData.total_price,
    //   });

    // if (txErr) {
    //   console.log(txErr);
    // }
    // console.log("tx:", tx);
  }

  async function finishOrder(storeOrder) {
    const { error } = await supabase.rpc("finish_order_store", {
      p_order_store_id: storeOrder.id, // สำคัญ!
    });

    if (error) {
      alert(error.message);
    } else {
      alert("รับอาหารเรียบร้อยแล้ว");
    }

    setOrders((prev) => ({
      ...prev,
      order_stores: prev.order_stores.map((os) =>
        os.id === storeOrder.id ? { ...os, status: "finished" } : os,
      ),
    }));
  }
  // render ทีหลัง
  //console.log("order", orders);
  if (!user) return <div>กำลังโหลด...</div>;

  if (user.role !== "customer") {
    return <div>ไม่มีสิทธิ์</div>;
  }
  if (!mounted) return null;
  return (
    <div>
      <div className={styles.summary_box}>
        <Link href="/orders" className={styles.back}>
          ⬅ กลับ
        </Link>
        <h3>Order #{orders.id}</h3>
        <hr />
        {orders?.order_stores?.map((store) => (
          <div key={store.id} className={styles.store_section}>
            {/* ชื่อร้าน */}
            <div className={styles.head}>
              <b>{store.stores.name}</b>{" "}
              <span className={`${store.status}bg ${styles.status}`}>
                {store.status}
              </span>
            </div>

            {/* รายการอาหาร */}

            {store.orders_details?.map((od) => (
              <div className={styles.item_row} key={od.id}>
                <div className="qty">{od.quantity}</div>

                <div>
                  {od.menus.name}{" "}
                  {od.note && <span className="note">{od.note}</span>}
                  {od.option &&
                    Object.values(od.option)
                      .filter((opt) => opt.label !== "ไม่เพิ่ม")
                      .map((opt, i) => (
                        <div key={i} className="option">
                          - {opt.label}
                          {opt.price > 0 && ` (+${opt.price}฿)`}
                        </div>
                      ))}
                </div>

                <div>฿{od.subtotal}</div>
              </div>
            ))}

            <div className={styles.store_total}>
              <span>฿{store.store_total}</span>
            </div>
            {/* {store.status === "ready" && (
              <button className="accept" onClick={() => finishOrder(store)}>
                รับอาหารแล้ว
              </button>
            )} */}
            <hr />
          </div>
        ))}

        {/* Total */}
        <div className={styles.total_row}>
          <b>ยอดสุทธิ (Total)</b>
          <b className="price">฿{orders?.total_price}</b>
        </div>
      </div>
    </div>
  );
}
