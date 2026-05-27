"use client";

import styles from "@/app/storereport/StoreReportPage.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import timeAgo from "@/lib/time_ago";

import Image from "next/image";
//import { startTransition } from "react";

export default function StoreReportPage() {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);

  const [selectTime, setSelectTime] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [totalSales, setTotalSales] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  const [topMenu, setTopMenu] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [orderCard, setOrderCard] = useState(null);
  const [openOrders, setOpenOrders] = useState({});
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

      setStore(store);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!store?.id) return;

    async function loadReport() {
      setLoading(true);

      let start;
      let end = new Date();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (selectTime) {
        case 0:
          start = today;
          break;

        case 1:
          start = new Date();
          start.setDate(today.getDate() - 6);
          start.setHours(0, 0, 0, 0);
          break;

        case 2:
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          break;

        case 3:
          if (!startDate || !endDate) {
            setLoading(false);
            return;
          }

          start = new Date(startDate);
          start.setHours(0, 0, 0, 0);

          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          break;

        case 4:
          // ทั้งหมด
          start = null;
          end = null;
          break;
      }

      let query = supabase
        .from("order_stores")
        .select(
          `
    store_total,
    orders!inner(id,created_at,status),
    orders_details(*,menus(*))
  `,
          { count: "exact" },
        )
        .eq("store_id", store.id)
        .eq("status", "finished");

      if (start && end) {
        query = query
          .gte("orders.created_at", start.toISOString())
          .lte("orders.created_at", end.toISOString());
      }

      const { data, count, error } = await query;
      const total = data?.reduce((sum, o) => sum + o.store_total, 0) || 0;

      setOrderCard(data);
      console.log("data", data);
      setTotalSales(total);
      setOrdersCount(count);
      setTopMenu(data);
      const menuSummary = {};

      data?.forEach((order) => {
        order.orders_details.forEach((od) => {
          const menuId = od.menus.id;

          if (!menuSummary[menuId]) {
            menuSummary[menuId] = {
              id: menuId,
              name: od.menus.name,
              img: od.menus.image_url,
              total_qty: 0,
              total_sales: 0,
            };
          }

          menuSummary[menuId].total_qty += od.quantity;
          menuSummary[menuId].total_sales += od.subtotal;
        });
      });

      const result = Object.values(menuSummary);

      console.log("result", result);
      const sorted = result.sort((a, b) => b.total_qty - a.total_qty);

      setTopMenu(sorted);
      setLoading(false);
    }

    loadReport();
  }, [store, selectTime, startDate, endDate]);

  console.log("topMenu", topMenu);

  if (!user) return <div>กำลังโหลด...</div>;

  if (user?.role !== "store_owner") {
    return <div>ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }
  console.log(selectTime);
  function getTextDayType(sel) {
    if (sel === 0) {
      return "วันนี้";
    } else if (sel === 1) {
      return "7 วันล่าสุด";
    } else if (sel === 2) {
      return "เดือนนี้";
    } else if (sel === 3) {
      return "ช่วงที่กำหนด";
    } else {
      return "ทั้งหมด";
    }
  }

  if (!mounted) return null;
  if (user.role !== "store_owner") {
    return <div>ไม่มีสิทธิ์</div>;
  }
  return (
    <div className={styles.content}>
      <div className={styles.top}>
        <h2>📊 รายงานยอดขาย</h2>
        <span>ตรวจสอบยอดขายของร้านค้า</span>
      </div>
      <div className={styles.filterday}>
        <button
          onClick={() => setSelectTime(0)}
          className={selectTime === 0 ? styles.active : ""}
        >
          วันนี้
        </button>
        <button
          onClick={() => setSelectTime(1)}
          className={selectTime === 1 ? styles.active : ""}
        >
          7 วันล่าสุด
        </button>
        <button
          onClick={() => setSelectTime(2)}
          className={selectTime === 2 ? styles.active : ""}
        >
          เดือน
        </button>
        <div className={styles.customdate}>
          {" "}
          <button
            onClick={() => setSelectTime(3)}
            className={selectTime === 3 ? styles.active : ""}
          >
            กำหนดช่วง
          </button>
          {selectTime === 3 && (
            <div className={styles.selectdate}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              -
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}{" "}
        </div>
        <button
          onClick={() => setSelectTime(4)}
          className={selectTime === 4 ? styles.active : ""}
        >
          ทั้งหมด
        </button>
      </div>
      <div className={styles.stat}>
        <div className={styles.stat_sales}>
          <span>💰 ยอดขายของ {getTextDayType(selectTime)}</span>
          {/* {orders?.map((o) => (
            <b key={o.id}>฿{o.total_price}</b>
          ))} */}
          {/* <b>{loading ? <span style={{fontSize:"20px"}}>⏳ กำลังคำนวณ...</span> : `฿${totalSales}`}</b> */}
          <b>฿{totalSales}</b>
        </div>
        <div className={styles.stat_count}>
          <span>📦 จำนวนออเดอร์ของ {getTextDayType(selectTime)}</span>
          <b>{ordersCount} ออเดอร์</b>
        </div>
      </div>
      {/* <div>sale charts</div> */}
      <div className={styles.topsell}>
        <h3>🌟 เมนูที่ขายดีที่สุดของ {getTextDayType(selectTime)}</h3>
        <div className={styles.dashboardGrid}>
          {/* ซ้าย */}
          <div className={styles.leftSection}>
            <div className={styles.orderList}>
              {orderCard?.map((order) => {
                const isOpen = openOrders[order.orders.id];

                return (
                  <div key={order.orders.id} className={styles.orderCard}>
                    <div
                      className={styles.orderHeader}
                      onClick={() =>
                        setOpenOrders((prev) => ({
                          ...prev,
                          [order.orders.id]: !prev[order.orders.id],
                        }))
                      }
                    >
                      <div>
                        <b>Order #{order.orders.id}</b>
                        <span>
                          {new Date(order.orders.created_at).toLocaleString(
                            "th-TH",
                            {
                              dateStyle: "short",
                              timeStyle: "short",
                            },
                          )}
                        </span>
                      </div>

                      <div className={styles.orderRight}>
                        <strong>฿{order.store_total}</strong>
                        <span>{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div className={styles.orderItems}>
                        {order.orders_details?.map((item) => (
                          <div key={item.id} className={styles.orderItem}>
                            <div>
                              <span>- </span>
                              <b>{item.menus?.name}</b>{" "}
                              <span>จำนวน {item.quantity} จาน</span>
                            </div>

                            <span>฿{item.subtotal}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ขวา */}
          <div className={styles.rightSection}>
            <div className={styles.topsell_list}>
              {topMenu?.map((tm, idx) => (
                <div key={tm.id} className={styles.topsell_card}>
                  <div className={styles.topsell_card_left}>
                    <h3
                      className={
                        idx + 1 === 1
                          ? styles.firstMenu
                          : idx + 1 === 2
                            ? styles.secondMenu
                            : idx + 1 === 3
                              ? styles.thirdMenu
                              : ""
                      }
                    >
                      #{idx + 1}
                    </h3>

                    <div className={styles.divimage}>
                      <Image
                        src={tm.img || "/iconmain.png"}
                        fill
                        alt="bgshop"
                        className={styles.imagemenu}
                      />
                    </div>

                    <div className={styles.topsell_card_left_text}>
                      <b>{tm.name}</b>
                      <span>ขายได้จำนวน {tm.total_qty} จาน</span>
                    </div>
                  </div>

                  <div className={styles.topsell_card_right}>
                    <span>ได้ราคาทั้งหมด</span>
                    <b>฿{tm.total_sales}</b>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
