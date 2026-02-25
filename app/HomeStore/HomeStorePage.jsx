"use client";

import styles from "@/app/HomeStore/HomeStore.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import timeAgo from "@/lib/time_ago";
import Image from "next/image";
//import { startTransition } from "react";

export default function HomeStorePage() {
  const [user, setUser] = useState(null);
  const [dataStore, setDataStore] = useState(null);
  const [myOrders, setMyOrders] = useState(null);
  const [myCooking, setMyCooking] = useState(null);
  const [select, setSelect] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      setUser(profile);

      const { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", auth.user.id)
        .single();

      setDataStore(store);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!dataStore) return;
    async function loadOrders() {
      const { data: orders } = await supabase
        .from("orders")
        .select(
          `
    *,
    orders_details (
      id,
      quantity,
      subtotal,
      menus (
        id,
        name,
        price,
        image_url
      )
    )
  `,
        )
        .eq("store_id", dataStore.id)
        .in("status", ["pending", "cooking"])
        .order("created_at", { ascending: false });

      setMyOrders(orders.filter((o) => o.status === "pending"));
      setMyCooking(orders.filter((o) => o.status === "cooking"));
    }
    loadOrders();
  }, [dataStore]);
  console.log("u", user);
  console.log("s", dataStore);
  console.log("o", myOrders);

  function Select(sel) {
    setSelect(sel);
  }
  console.log(select);
  if (!mounted) return <div className="nologin">กำลังโหลดข้อมูลร้าน...</div>;
  return (
    <>
      <div className={styles.container}>
        <div className={styles.top}>
          {" "}
          <div className={styles.top_name}>
            <div className={styles.top_head}>
              {" "}
              <div className={styles.divimage}>
                <Image
                  src={dataStore?.image_url || "/iconmain.png"}
                  fill
                  alt="bgshop"
                  className={styles.imagestore}
                />
              </div>{" "}
              <div>
                <h1>{dataStore?.name} </h1>
                <h3>
                  {user?.username} - {user?.role}
                </h3>
              </div>{" "}
            </div>
            <div className={`${styles.top_status} pageFade`}>
              <div className={styles.top_pending}>
                <span>รอดำเนินการ</span>
                <h3>{myOrders?.length}</h3>
              </div>
              <div className={styles.top_cooking}>
                <span>กำลังทำ</span>
                <h3>{myCooking?.length}</h3>
              </div>
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className={styles.select}>
          <button
            onClick={() => Select(null)}
            className={select === null ? styles.active : ""}
          >
            รอดำเนินการ
          </button>
          <button
            onClick={() => Select(1)}
            className={select !== null ? styles.active : ""}
          >
            กำลังทำ
          </button>
        </div>
        <div className={styles.order_lists}>
          {!select ? (
            myOrders && myOrders.length !== 0 ? (
              myOrders.map((o) => (
                <div className={styles.order} key={o.id}>
                  <div className={styles.order_text}>
                    <div className={styles.order_left}>
                      <div className={styles.order_top}>
                        <h4>Order #{o.id}</h4>
                        <span className={styles.order_pending}> ใหม่ !</span>
                      </div>
                      <span className={styles.timeago}>
                        {timeAgo(o.created_at)}
                      </span>
                    </div>
                    <div className={styles.total}>{o.total_price} บาท</div>
                  </div>{" "}
                  <div className={styles.order_menu}>
                    {o.orders_details.map((od) => (
                      <div key={od.id} className={styles.order_menu_list}>
                        <span>
                          {od.menus.name}{" "}
                          <span style={{ color: "#004085" }}>
                            x{od.quantity}{" "}
                          </span>
                        </span>

                        <span style={{ color: "#004085" }}>
                          {od.menus.price} บาท
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.order_bottom}>
                    <button className={styles.accept}>รับออเดอร์</button>{" "}
                    <button className={styles.reject}>ปฏิเสธ</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="nolist">ไม่มีออเดอร์</div>
            )
          ) : myCooking && myCooking.length !== 0 ? (
            myCooking.map((oc) => (
              <div className={styles.order} key={oc.id}>
                <div className={styles.order_text}>
                  <div className={styles.order_left}>
                    <div className={styles.order_top}>
                      <h4>Order #{oc.id}</h4>
                      <span className={styles.order_cooking}> กำลังทำ</span>
                    </div>
                    <span className={styles.timeago}>
                      {timeAgo(oc.created_at)}
                    </span>
                  </div>
                  <div className={styles.total}>{oc.total_price} บาท</div>
                </div>{" "}
                <div className={styles.order_menu}>
                  {oc.orders_details.map((od) => (
                    <div key={od.id} className={styles.order_menu_list}>
                      <span>
                        {od.menus.name}{" "}
                        <span style={{ color: "#004085" }}>
                          x{od.quantity}{" "}
                        </span>
                      </span>

                      <span style={{ color: "#004085" }}>
                        {od.menus.price} บาท
                      </span>
                    </div>
                  ))}
                </div>
                <div className={styles.order_bottom}>
                  <button className={styles.success}>เสร็จสิ้น</button>{" "}
                </div>
              </div>
            ))
          ) : (
            <div className="nolist">ไม่มีออเดอร์</div>
          )}
        </div>
      </div>
    </>
  );
}
