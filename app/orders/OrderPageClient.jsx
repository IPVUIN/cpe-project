"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/orders/orderPage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function OrderCartPageClient() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState(null);
 // const [myOrders, setMyOrders] = useState(null);
  const [myCooking, setMyCooking] = useState(null);
  const [myReady, setMyReady] = useState(null);
  const [myCompleted, setMyCompleted] = useState(null);
  // const [store, setStore] = useState(null);
  const [selectStatus, setSelectStatus] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  // const [ordersCart, setOrdersCart] = useState(null);

  // โหลด user
  // useEffect(() => {
  //   supabase.auth.getUser().then(({ data }) => {
  //     setUser(data.user);
  //   });
  // }, []);

  // โหลด order list
  // useEffect(() => {
  //   if (!user) return;

  //   async function loadOrders() {
  //     const { data } = await supabase.auth.getSession();
  //     const token = data.session?.access_token;

  //     const res = await fetch("/api/orders", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     const result = await res.json();
  //     setOrders(Array.isArray(result.orders) ? result.orders : []);
  //     console.log("API RESULT:", result);
  //   }

  //   loadOrders();
  // }, [user]);

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
        status,
        order_stores (
          id,
          store_id,
          order_id,
          store_total,
          stores(name,image_url),
          status,
          orders_details (
            id,
            order_stores_id,
            quantity,
            price,
            subtotal,
            note,
            menus(name,price)
          )
        )
      `,
        )
        .eq("user_id", user.id)
        .neq("status", "cart")
        .order("created_at", { ascending: false });

      setOrders(orders.filter((o) => o.status === "active"));
      // const pendingStores = orders
      //   .flatMap((order) => order.order_stores)
      //   .filter((o) => o.status === "pending");

      // setMyOrders(pendingStores);
      // setMyCooking(orders.filter((o) => o.status === "cooking"));
      // setMyReady(orders.filter((o) => o.status === "ready"));
      setMyCompleted(orders.filter((o) => o.status === "completed"));
    }

    loadOrders();
  }, [user]);
  console.log("Orders", orders);
  console.log("myCompleted", myCompleted);
  function OrderCard({ oc }) {
    return (
      <div className={styles.order_card}>
        {/* Header */}
        <div className={styles.order_header}>
          <div>
            <h4>Order #{oc.id}</h4>
            <span className={styles.time}>
              {" "}
              {new Date(oc.created_at).toLocaleString("th-TH", {
                dateStyle: "short",
                timeStyle: "short",
              })}{" "}
            </span>
          </div>

          {/* <div className={styles.status}>กำลังดำเนินการ</div> */}
        </div>

        {/* Store */}
        {oc.order_stores.map((os) => (
          <div key={os.id} className={styles.store_box}>
            <div className={styles.store_info}>
              <div className={styles.store_image}>
                <Image
                  src={os.stores.image_url}
                  fill
                  alt="store"
                  className={styles.image}
                />
              </div>

              <div className={styles.store_text}>
                <b>{os.stores.name}</b>
                <span>รวมทั้งหมด {os.orders_details.length} รายการ</span>
              </div>
            </div>
            <div className={styles.store_status}>
              <span className={`${os.status}bg`}>{os.status}</span>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className={styles.order_footer}>
          <b className="price">รวม ฿{oc.total_price}</b>
          <Link href={`/orders/${oc.id}`} className={styles.detail}>
            ดูรายละเอียด →
          </Link>
        </div>
      </div>
    );
  }

  function renderOrders(list) {
    if (!list || list.length === 0) {
      return <div className="nolist">ไม่มีออเดอร์</div>;
    }

    return list.map((oc) => <OrderCard key={oc.id} oc={oc} />);
  }
  // render ทีหลัง
  if (!user) return <div>กำลังโหลด...</div>;

  if (user.role !== "customer") {
    return <div>ไม่มีสิทธิ์</div>;
  }
  if (!mounted) return null;
  //console.log("order", orders);
  return (
    <div>
      <div className={styles.head}>
        <h1>🍔 ออเดอร์ของฉัน</h1>
        <span>รายการออเดอร์</span>
      </div>

      <div className={styles.select}>
        <button
          className={selectStatus === 0 ? `${styles.active} cooking` : ""}
          onClick={() => setSelectStatus(0)}
        >
          📑 กำลังดำเนินการ
        </button>
        <button
          className={selectStatus === 1 ? `${styles.active} finished` : ""}
          onClick={() => setSelectStatus(1)}
        >
          ✅ ประวัติ
        </button>
        {/* <button
          className={selectStatus === 2 ? `${styles.active} ready` : ""}
          onClick={() => setSelectStatus(2)}
        >
          🍜 พร้อมแล้ว
        </button>
        <button
          className={selectStatus === 3 ? `${styles.active} finished` : ""}
          onClick={() => setSelectStatus(3)}
        >
          ✅ เสร็จสิ้น
        </button> */}
      </div>
      <div className={styles.order}>
        {/* {orders.length === 0 && <div>ไม่มีคำสั่งซื้อ</div>} */}
        {selectStatus === 0 && renderOrders(orders)}
        {selectStatus === 1 && renderOrders(myCompleted)}
        {/* {selectStatus === 2 && renderOrders(myReady)}
        {selectStatus === 3 && renderOrders(myFinished)} */}

        {/* {orders.length === 0 && (
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
        ))} */}
      </div>
    </div>
  );
}
