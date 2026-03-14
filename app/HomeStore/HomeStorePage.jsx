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
      const { data: orders } = await supabase
        .from("orders")
        .select(
          `
    *,
    orders_details (
      id,
      quantity,
      subtotal,note,
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
        .in("status", ["cart", "pending", "cooking", "ready", "finished"])
        .order("created_at", { ascending: false });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("orders")
        .select("total_price")
        .eq("store_id", dataStore.id)
        .eq("status", "finished")
        .gte("created_at", today.toISOString());

      const total = data?.reduce((sum, o) => sum + o.total_price, 0) || 0;
      setTotalSales(total);
      //setMyCart(orders.filter((o) => o.status === "cart"));
      setMyOrders(orders.filter((o) => o.status === "pending"));
      setMyCooking(orders.filter((o) => o.status === "cooking"));
      setMyReady(orders.filter((o) => o.status === "ready"));
      setMyFinished(orders.filter((o) => o.status === "finished"));
    }
    loadOrders();
  }, [dataStore]);

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
  console.log("o", myOrders);
  console.log("cook", myCooking);
  console.log("mycart", myCart);
  console.log("mYF", myFinished);
  // console.log("menu", menus);
  // console.log("cat", menuCate);

  useEffect(() => {
    if (openModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [openModal]);

  useEffect(() => {
    if (!user) return; // รอ user มาก่อน
    loadCart();
  }, [user]);
  function Select(sel) {
    setSelect(sel);
  }

  async function UpdateOrder(orderId, newStatus, orderData) {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    if (newStatus === "cancel") {
      setMyOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
    if (newStatus === "cooking") {
      if (orderData.user_id !== dataStore.user_id) {
        //console.log("test")
        const { data: wallet } = await supabase
          .from("wallet")
          .select("*")
          .eq("user_id", orderData.user_id)
          .single();

        const { error: walletUpdateErr } = await supabase
          .from("wallet")
          .update({
            balance: wallet.balance - orderData.total_price,
            reserved_balance: wallet.reserved_balance - orderData.total_price,
          })
          .eq("user_id", orderData.user_id);

        setMyOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
      if (myCart) {
        setOpenModal(false);
        loadCart();
        setModalStep("list");
      }
      setMyCooking((prev) => [{ ...orderData, status: newStatus }, ...prev]);
    }

    if (newStatus === "ready") {
      setMyCooking((prev) => prev.filter((o) => o.id !== orderId));

      setMyReady((prev) => [{ ...orderData, status: newStatus }, ...prev]);
    }

    if (newStatus === "cancel") {
      const { data: wallet } = await supabase
        .from("wallet")
        .select("*")
        .eq("user_id", orderData.user_id)
        .single();

      const { error: walletUpdateErr } = await supabase
        .from("wallet")
        .update({
          reserved_balance: wallet.reserved_balance - orderData.total_price,
        })
        .eq("user_id", orderData.user_id);
    }
    if (newStatus === "finished") {
      setMyCooking((prev) => prev.filter((o) => o.id !== orderId));

      setMyFinished((prev) => [ { ...orderData, status: newStatus },...prev,]);
    }
  }

  function OrderCard({ oc, status }) {
    return (
      <div className={styles.order}>
        <div className={styles.order_text}>
          <div className={styles.order_left}>
            <div className={styles.order_top}>
              <h4>Order #{oc.id}</h4>
              <span className={styles[`order_${status}`]}>
                {getStatusText(status)}{" "}
              </span>
              <span style={{opacity:"50%"}}>
                {oc.user_id === dataStore.user_id ? "ออเดอร์หน้าร้าน" : ""}
              </span>
            </div>
            <span className={styles.timeago}>
              {status === "finished"
                ? new Date(oc.created_at).toLocaleString("th-TH", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : timeAgo(oc.created_at)}{" "}
            </span>
          </div>

          <div className={styles.total}>฿{oc.total_price}</div>
        </div>

        <div className={styles.order_menu}>
          {oc.orders_details?.map((od) => (
            <div key={od.id} className={styles.order_menu_list}>
              <span>
                {od.menus.name}
                {od.note ? (
                  <span style={{ color: "#f1a500", margin: "0 10px" }}>
                    ({od.note})
                  </span>
                ) : (
                  " "
                )}
                <span style={{ fontWeight: "bold" }}>x{od.quantity}</span>
              </span>
              <span>฿{od.subtotal} </span>
            </div>
          ))}
        </div>

        <div className={styles.order_bottom}>{renderButton(status, oc)}</div>
      </div>
    );
  }
  function getStatusText(status) {
    if (status === "pending") return "รอรับ";
    if (status === "cooking") return "กำลังทำ";
    if (status === "ready") return "รอรับอาหาร";
    if (status === "finished") return "สำเร็จ";
  }
  function renderButton(status, oc) {
    if (status === "pending") {
      return (
        <>
          <button
            onClick={() => UpdateOrder(oc.id, "cooking", oc)}
            className={styles.accept}
          >
            รับออเดอร์
          </button>{" "}
          <button
            onClick={() => UpdateOrder(oc.id, "cancel", oc)}
            className={styles.reject}
          >
            ปฏิเสธ
          </button>
        </>
      );
    }
    if (status === "cooking") {
      if (oc.user_id !== dataStore.user_id) {
        return (
          <button
            onClick={() => UpdateOrder(oc.id, "ready", oc)}
            className={styles.success}
          >
            เสร็จสิ้น
          </button>
        );
      } else {
        return (
          <button
            onClick={() => UpdateOrder(oc.id, "finished", oc)}
            className={styles.success}
          >
            เสร็จสิ้น
          </button>
        );
      }
    }
    // if (status === "ready") {
    //   return (
    //     <button
    //       onClick={() => UpdateOrder(oc.id, "finished", oc)}
    //       className={styles.received}
    //     >
    //       ลูกค้ารับแล้ว
    //     </button>
    //   );
    // }

    //  if (status === "finished") {
    //   return (
    //     <button
    //      // onClick={() => UpdateOrder(oc.id, "finished", oc)}
    //       className={styles.received}
    //     >
    //       ลูกค้ารับแล้ว
    //     </button>
    //   );
    // }
    return null;
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

  async function loadCart() {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
      *,
      orders_details (
        *,
        menus (*)
      )
    `,
      )
      .eq("user_id", user?.id)
      .eq("status", "cart");

    if (error) {
      console.error(error);
      return;
    }
    console.log("datacart", data);
    if (!data || data.length === 0) {
      setMyCart(null);
      setOrderTotal(0);
      setCountList(0);
      return;
    }

    const order = data[0];

    setMyCart(order);

    const totalQty =
      order.orders_details?.reduce((sum, row) => sum + row.quantity, 0) || 0;

    setCountList(totalQty);

    const totalSub =
      order.orders_details?.reduce((sum, row) => sum + row.subtotal, 0) || 0;

    setOrderTotal(totalSub);
  }
  async function addToOrder(menu, qty, note) {
    const { data: orderCart, error: orderCartError } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user?.id)
      .eq("status", "cart")
      .maybeSingle();
    //console.log("orderCart :  ", orderCart, menu);
    if (orderCartError) {
      alert(orderCartError.message);
      return;
    }
    let orderId = orderCart?.id;
    if (!orderId) {
      const { data: newOrder, error: newOrderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          store_id: dataStore.id,
          status: "cart",
          total_price: menu.price,
        })
        .select("id")
        .single();
      if (newOrderError) {
        alert(newOrderError.message);
        return;
      }
      orderId = newOrder.id;
    }
    //  console.log("newOrder : ", orderId);
    const { data: newMenu, error: newMenuError } = await supabase
      .from("menus")
      .select("store_id")
      .eq("id", menu.id)
      .single();
    if (newMenuError) {
      alert(newMenuError.message);
      return;
    }
    //console.log("NEWMENU:", newMenu);
    // //  console.log("store:", newOrder);
    const { data: storeIdOrder, error: storeIdOrderError } = await supabase
      .from("orders")
      .select("store_id")
      .eq("id", orderId)
      .single();
    if (storeIdOrderError) {
      alert(storeIdOrderError.message);
      return;
    }
    // console.log("store:", storeIdOrder);
    const { data: item, error: itemError } = await supabase
      .from("orders_details")
      .select("id,menu_id, quantity")
      .eq("order_id", orderId)
      .eq("menu_id", menu.id)
      .eq("note", note ?? null)
      .maybeSingle();
    if (itemError) {
      alert(itemError.message);
      return;
    }
    //  console.log("item:", item);
    // // 5) quantity + 1
    if (item) {
      const { data: update, error: updateError } = await supabase
        .from("orders_details")
        .update({
          quantity: item.quantity + qty,
          subtotal: (item.quantity + qty) * menu.price,
        })
        .eq("order_id", orderId) //
        .eq("id", item.id)
        .select();
      if (updateError) {
        alert(updateError.message);
        return;
      }
      alert("เพิ่มลงตะกร้าแล้ว2 🛒");
    } else {
      if (newMenu.store_id === storeIdOrder.store_id) {
        const { error: insertError } = await supabase
          .from("orders_details")
          .insert({
            order_id: orderId,
            menu_id: menu.id,
            quantity: qty,
            price: menu.price,
            subtotal: qty * menu.price,
            note: note,
          });
        if (insertError) {
          alert(insertError.message);
          return;
        }
        alert("เพิ่มลงตะกร้าแล้ว3 🛒");
      } else {
        alert("ไม่สามารถเพิ่มเมนูจากร้านอื่นได้!");
      }
    }
    const { data: total, error: totalError } = await supabase
      .from("orders_details")
      .select("subtotal,quantity")
      .eq("order_id", orderId);
    if (totalError) {
      alert(totalError.message);
      return;
    }
    // console.log("TOTAL", total);
    const totalsub = total.reduce((sum, row) => sum + row.subtotal, 0);
    const totalqty = total.reduce((sum, row) => sum + row.quantity, 0);
    // console.log("totalsub", totalsub);
    // console.log("totalqty", totalqty);
    const { error: orderError } = await supabase
      .from("orders")
      .update({ total_price: totalsub })
      .eq("id", orderId);
    if (orderError) {
      alert(orderError.message);
      return;
    }
    setOrderTotal(totalsub);
    setCountList(totalqty);
    await loadCart();
  }

  async function Delmenu(itemId) {
    const { error } = await supabase
      .from("orders_details")
      .delete()
      .eq("id", itemId);

    if (error) {
      alert(error.message);
      return;
    }
    await loadCart();
    // ลบจาก state ทันที
    setMyCart((prev) => ({
      ...prev,
      orders_details: prev.orders_details.filter((item) => item.id !== itemId),
    }));
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
              <div>
                <button
                  className={styles.addorder}
                  onClick={() => {
                    //    setMenus(menu);
                    setOpenModal(true);
                  }}
                >
                  + เพิ่มออเดอร์
                </button>
              </div>
            </div>
            <div className={`${styles.top_status} pageFade`}>
              <div className={styles.top_sale}>
                <span>💰 ยอดขายวันนี้</span>
                <h3>฿{totalSales}</h3>
              </div>
              <div className={`${styles.top_pending} pending`}>
                <span>📑 ออเดอร์ใหม่</span>
                <h3>{myOrders?.length}</h3>
              </div>
              <div className={`${styles.top_cooking} cooking`}>
                <span>👨‍🍳 กำลังทำ</span>
                <h3>{myCooking?.length}</h3>
              </div>
              <div className={`${styles.top_ready} ready`}>
                <span>✅ เสร็จสิ้น</span>
                <h3>{myFinished?.length}</h3>
              </div>
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className={styles.select}>
          <button
            onClick={() => Select(null)}
            className={select === null ? `${styles.active} pending` : ""}
          >
            📑 ออเดอร์ใหม่{" "}
            {myOrders?.length > 0 ? (
              <span className={styles.newOrder}>{myOrders.length}</span>
            ) : (
              ""
            )}
          </button>
          <button
            onClick={() => Select(1)}
            className={select === 1 ? `${styles.active} cooking` : ""}
          >
            👨‍🍳 กำลังทำ
          </button>
          <button
            onClick={() => Select(2)}
            className={select === 2 ? `${styles.active} ready` : ""}
          >
            🍜 รอรับ
          </button>
          <button
            onClick={() => Select(3)}
            className={select === 3 ? `${styles.active} finished` : ""}
          >
            ✅ ประวัติ
          </button>
        </div>
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
