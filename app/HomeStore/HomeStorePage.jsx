"use client";

import styles from "@/app/HomeStore/HomeStore.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import timeAgo from "@/lib/time_ago";
import Image from "next/image";
import AddOrderModal from "./AddOrderModal";
//import { startTransition } from "react";

export default function HomeStorePage() {
  const [user, setUser] = useState(null);
  const [dataStore, setDataStore] = useState(null);
  const [myOrders, setMyOrders] = useState(null);
  const [myCooking, setMyCooking] = useState(null);
  const [myReady, setMyReady] = useState(null);
  const [myFinished, setMyFinished] = useState(null);
  const [select, setSelect] = useState(null);
  const [totalSales, setTotalSales] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [menus, setMenus] = useState([]);

  const [menuc, setMenuc] = useState(null);
  const [menuCate, setMenuCate] = useState(null);
  const filteredMenus = menus.filter((menu) => {
    const matchCategory = menuCate ? menu.menu_category === menuCate : true;

    return matchCategory;
  });
  const sortedMenus = [...filteredMenus].sort((a, b) => a.id - b.id);
  const [openModal, setOpenModal] = useState(false);
  const [modalStep, setModalStep] = useState("list");
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [note, setNote] = useState("");
  const [countAdd, setCountAdd] = useState(0);
  const [OrderTotal, setOrderTotal] = useState(0);
  const [countList, setCountList] = useState(0);
  const [myCart, setMyCart] = useState(null);

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
      const { data: orders } = await supabase.from("order_stores").select(
        `
    *,stores(id,name),
    orders(id,created_at,status,user_id,users(id,line_id)),
    orders_details(*,menus(*))
  `,
      );
      const sortedOrders = orders?.sort(
        (a, b) =>
          new Date(b.orders?.created_at) - new Date(a.orders?.created_at),
      );
      //  .eq("store_id", dataStore.id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("order_stores")
        .select(
          `
    store_total,
    orders!inner(created_at,status)
  `,
        )
        .eq("store_id", dataStore.id)
        .eq("orders.status", "completed")
        .gte("orders.created_at", today.toISOString());
      console.log("data", data);
      const total = data?.reduce((sum, o) => sum + o.store_total, 0) || 0;
      setTotalSales(total);
      //setMyCart(orders.filter((o) => o.status === "cart"));
      setMyOrders(sortedOrders.filter((o) => o.status === "pending"));
      setMyCooking(sortedOrders.filter((o) => o.status === "cooking"));
      setMyReady(sortedOrders.filter((o) => o.status === "ready"));
      setMyFinished(sortedOrders.filter((o) => o.status === "finished"));
    }
    loadOrders();
  }, [dataStore]);
  //console.log("dataStore", dataStore?.user_id);

  console.log("order", myOrders);
  console.log("cooking", myCooking);
  console.log("ready", myReady);
  useEffect(() => {
    if (!dataStore) return;

    async function loadCategory() {
      const { data: category } = await supabase
        .from("menu_category")
        .select("*")
        .eq("store_id", dataStore.id);

      setMenuc(category);
    }
    async function loadMenu() {
      const { data: menu } = await supabase
        .from("menus")
        .select("*")
        .eq("store_id", dataStore.id)
        .eq("is_active", true);
      setMenus(menu);
    }
    loadCategory();
    loadMenu();
  }, [dataStore]);
  // console.log("u", user);
  // console.log("s", dataStore);
  // console.log("o", myOrders);
  // console.log("cook", myCooking);
  // console.log("mycart", myCart);
  // console.log("mYF", myFinished);
  // console.log("menu", menus);
  // console.log("cat", menuCate);

  useEffect(() => {
    if (openModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [openModal]);

  // useEffect(() => {
  //   if (!user) return; // รอ user มาก่อน
  //   loadCart();
  // }, [user]);
  function Select(sel) {
    setSelect(sel);
  }

  async function UpdateOrder(orderId, newStatus, orderData) {
    const { error } = await supabase
      .from("order_stores")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    if (newStatus === "cancel") {
      setMyOrders((prev) => prev.filter((o) => o.id !== orderId));
      const { data: wallet } = await supabase
        .from("wallet")
        .select("*")
        .eq("user_id", orderData.orders.user_id)
        .single();
      const { error: walletUpdateErr } = await supabase
        .from("wallet")
        .update({
          reserved_balance: wallet.reserved_balance - orderData.store_total,
        })
        .eq("user_id", orderData.orders.user_id);
    }
    if (newStatus === "cooking") {
      //console.log("test")
      setMyOrders((prev) => prev.filter((o) => o.id !== orderId));
      setMyCooking((prev) => [{ ...orderData, status: newStatus }, ...prev]);
      const { data: wallet } = await supabase
        .from("wallet")
        .select("*")
        .eq("user_id", orderData.orders.user_id)
        .single();

      const { error: walletUpdateErr } = await supabase
        .from("wallet")
        .update({
          balance: wallet.balance - orderData.store_total,
          reserved_balance: wallet.reserved_balance - orderData.store_total,
        })
        .eq("user_id", orderData.orders.user_id);

      if (myCart) {
        setOpenModal(false);
        loadCart();
        setModalStep("list");
      }
      //   console.log("wallet", wallet);
    }

    if (newStatus === "ready") {
      setMyCooking((prev) => prev.filter((o) => o.id !== orderId));

      setMyReady((prev) => [{ ...orderData, status: newStatus }, ...prev]);

      const lineId = orderData.orders.users.line_id;
      // 3) send line
      if (lineId) {
        await fetch("/api/line/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: lineId,
            message: `🍜 Order #${orderData.orders.id} จากร้าน${orderData.stores.name}พร้อมแล้ว มารับได้เลยครับ`,
          }),
        });
      }
    }

    // if (newStatus === "finished") {
    //   setMyCooking((prev) => prev.filter((o) => o.id !== orderId));

    //   setMyFinished((prev) => [{ ...orderData, status: newStatus }, ...prev]);
    // }
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

    setTotalSales((prev) => prev + storeOrder.store_total);
    setMyReady((prev) => prev.filter((o) => o.id !== storeOrder.id));
    setMyFinished((prev) => [{ ...storeOrder, status: "finished" }, ...prev]);
  }
  function OrderCard({ oc, status }) {
    return (
      <div className={styles.orderContainer}>
        <div className={styles.orderCard}>
          {/* 🔹 Header */}
          <div className={styles.cardHeader}>
            <div>
              <b>Order #{oc.orders?.id}</b>
              <span className={styles.time}>
                {new Date(oc.orders?.created_at).toLocaleString("th-TH", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <span>{oc.status}</span>
          </div>

          {/* 🔹 รายการอาหาร */}
          <div className={styles.menuList}>
            {oc.orders_details?.map((item) => (
              <div key={item.id} className={styles.menuItem}>
                <span>
                  <span className="qty">{item.quantity}</span> x{" "}
                  {item.menus.name}{" "}
                  {item.note && <span className="note">[{item.note}]</span>}
                  <div className={styles.option}>
                    {item.option &&
                      Object.values(item.option).map((opt, i) => (
                        <span key={i} className="option">
                          {opt.label === "ไม่เพิ่ม" ? "" : `- ${opt.label}`}
                        </span>
                      ))}{" "}
                  </div>
                </span>
                <span>฿{item.subtotal}</span>
              </div>
            ))}
          </div>

          {/* 🔹 Total */}
          <div className={styles.total}>
            <b className="price">รวม: ฿{oc.store_total}</b>
          </div>

          {/* 🔹 Actions */}
          <div className={styles.actions}>
            {oc.status === "pending" && (
              <>
                <button
                  className="accept"
                  onClick={() => UpdateOrder(oc.id, "cooking", oc)}
                >
                  รับออเดอร์
                </button>
                <button
                  className="cancel"
                  onClick={() => UpdateOrder(oc.id, "cancel", oc)}
                >
                  ยกเลิก
                </button>
              </>
            )}

            {oc.status === "cooking" && (
              <>
                {" "}
                <button
                  onClick={() => UpdateOrder(oc.id, "ready", oc)}
                  className="done"
                >
                  พร้อมเสิร์ฟ
                </button>
              </>
            )}
            {oc.status === "ready" && (
              <>
                {" "}
                <button className="accept" onClick={() => finishOrder(oc)}>
                  รับออเดอร์แล้ว
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderOrders(list, status) {
    if (!list || list.length === 0) {
      return <div className="nolist">ไม่มีออเดอร์</div>;
    }

    return list.map((oc) => <OrderCard key={oc.id} oc={oc} status={status} />);
  }
  //console.log(select);

  function cate(catId) {
    setMenuCate(catId);
  }
  function count(value) {
    setCountAdd((prev) => prev + value);
  }

  async function testLine() {
    await fetch("/api/line/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "U34b45183dad4fea8d5c5e480858cf4de",
        message: "Test alarm",
      }),
    });
  }
  if (!mounted) return <div className="nologin">กำลังโหลดข้อมูลร้าน...</div>;
  return (
    <>
      <div>
        {/* <button onClick={()=>testLine()}>testline</button> */}
        <div className={styles.top}>
          {" "}
          <div className={styles.top_name}>
            <div className={styles.top_head}>
              {" "}
              <div className={styles.top_head_left}>
                <div className={styles.divimage}>
                  <Image
                    src={dataStore?.image_url || "/iconmain.png"}
                    fill
                    priority // ✅ ใช้แค่นี้พอ
                    sizes="150px"
                    alt="bgshop"
                    className={styles.imagestore}
                  />
                </div>{" "}
                <div>
                  <h2>{dataStore?.name} </h2>
                  <span>
                    {user?.username} - {user?.role}
                  </span>
                </div>{" "}
                {!user?.line_id ? (
                  <div className={styles.line_banner}>
                    <div>
                      <h3>🔔 รับแจ้งเตือนออเดอร์ผ่าน LINE</h3>
                      <p>เมื่ออาหารของคุณเสร็จ เราจะแจ้งเตือนทันที</p>
                    </div>

                    <button
                      className={styles.line_btn}
                      onClick={() =>
                        window.open(
                          "https://line.me/R/ti/p/@526ogsoy",
                          "_blank",
                        )
                      }
                    >
                      เพิ่มเพื่อน LINE
                    </button>
                  </div>
                ) : (
                  <div className={styles.connected}>✅ เชื่อม LINE แล้ว</div>
                )}
              </div>
              {/* <div>
                <button
                  className={styles.addorder}
                  onClick={() => {
                    //    setMenus(menu);
                    setOpenModal(true);
                  }}
                >
                  + เพิ่มออเดอร์
                </button>
              </div> */}
              <Link
                href="/storereport"
                className={`${styles.statCard} ${styles.saleCard}`}
              >
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>ยอดขายวันนี้</span>
                  <b className={styles.statValue}>
                    ฿{Number(totalSales || 0).toLocaleString("th-TH")}
                  </b>
                </div>
              </Link>
            </div>
            {/* <hr /> */}
            <div className={`${styles.top_status} pageFade`}>
              <div
                className={`
    ${styles.statCard}
    ${styles.pendingCard}
    ${select === null ? `${styles.activepending}` : ""}
  `}
                onClick={() => Select(null)}
              >
                <div className={`${styles.statIcon} pendingicon`}>📑</div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>ออเดอร์ใหม่</span>
                  <span className={styles.statValue}>
                    {myOrders?.length || 0}
                  </span>
                </div>
              </div>

              <div
                className={`${styles.statCard} ${styles.cookingCard}  ${select === 1 ? `${styles.activecooking}` : ""}`}
                onClick={() => Select(1)}
              >
                <div className={`${styles.statIcon} cookingicon`}>👨‍🍳</div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>กำลังทำ</span>
                  <span className={styles.statValue}>
                    {myCooking?.length || 0}
                  </span>
                </div>
              </div>

              <div
                className={`${styles.statCard} ${styles.readyCard}  ${select === 2 ? `${styles.activeready}` : ""}`}
                onClick={() => Select(2)}
              >
                <div className={`${styles.statIcon} readyicon`}>👨‍🍳</div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>รอรับอาหาร</span>
                  <span className={styles.statValue}>
                    {myReady?.length || 0}
                  </span>
                </div>
              </div>

              <div
                className={`${styles.statCard} ${styles.finishedCard}  ${select === 3 ? `${styles.activefinished}` : ""}`}
                onClick={() => Select(3)}
              >
                <div className={`${styles.statIcon} finishedicon`}>✅</div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>เสร็จสิ้น</span>
                  <span className={styles.statValue}>
                    {myFinished?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>{" "}
        </div>{" "}
        <div className={styles.order_lists}>
          {!select && renderOrders(myOrders, "pending")}
          {select === 1 && renderOrders(myCooking, "cooking")}
          {select === 2 && renderOrders(myReady, "ready")}
          {select === 3 && renderOrders(myFinished, "finished")}
        </div>
        {openModal && (
          <AddOrderModal
            setOpenModal={setOpenModal}
            setMenuCate={setMenuCate}
            menuCate={menuCate}
            menuc={menuc}
            cate={cate}
            sortedMenus={sortedMenus}
            setSelectedMenu={setSelectedMenu}
            modalStep={modalStep}
            setModalStep={setModalStep}
            countList={countList}
            OrderTotal={OrderTotal}
            countAdd={countAdd}
            count={count}
            setCountAdd={setCountAdd}
            note={note}
            setNote={setNote}
            selectedMenu={selectedMenu}
            addToOrder={addToOrder}
            myCart={myCart}
            Delmenu={Delmenu}
            UpdateOrder={UpdateOrder}
          />
        )}
      </div>
    </>
  );
}
