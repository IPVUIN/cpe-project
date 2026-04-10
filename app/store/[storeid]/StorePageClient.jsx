"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/store/[storeid]/storePage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ModalOrder from "./ModalOrder";
export default function StorePageClient({ store, menus, menusCate }) {
  // ระหว่างโหลด
  if (!store) return <div className="nologin">กำลังโหลดข้อมูลร้าน...</div>;

  const [user, setUser] = useState(null);
  const [menuc, setMenuc] = useState(null);

  const [menuCate, setMenuCate] = useState(null);
  const filteredMenus = menus.filter((menu) => {
    const matchCategory = menuCate ? menu.menu_category === menuCate : true;

    return matchCategory;
  });
  const sortedMenus = [...filteredMenus].sort((a, b) => a.id - b.id);

  const [showModal, setShowModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [note, setNote] = useState("");
  const [countAdd, setCountAdd] = useState(1);
  const [OrderTotal, setOrderTotal] = useState(0);
  const [countList, setCountList] = useState(0);
  // console.log("s", sortedMenus);
  // console.log("MM", menus);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    setMenuc(menusCate);
  }, [menusCate]);

  function cate(catId) {
    setMenuCate(catId);
  }

  console.log("selectedMenu", selectedMenu);

  // async function addToOrder(menuId, price) {
  //   // 1) หา cart
  //   const { data: orderCart, error: orderCartError } = await supabase
  //     .from("orders")
  //     .select("id")
  //     .eq("user_id", user.id)
  //     .eq("status", "cart")
  //     .maybeSingle();

  //   if (orderCartError) {
  //     alert(orderCartError.message);
  //     return;
  //   }

  //   let orderId = orderCart?.id;

  //   // 2) ถ้าไม่มี cart → สร้าง
  //   if (!orderId) {
  //     const { data: newOrder, error: newOrderError } = await supabase
  //       .from("orders")
  //       .insert({
  //         user_id: user.id,
  //         status: "cart",
  //         total_price: 0,
  //       })
  //       .select("id")
  //       .single();

  //     if (newOrderError) {
  //       alert(newOrderError.message);
  //       return;
  //     }

  //     orderId = newOrder.id;
  //   }

  //   // 3) หา store ของ menu
  //   const { data: menu, error: menuError } = await supabase
  //     .from("menus")
  //     .select("store_id")
  //     .eq("id", menuId)
  //     .single();

  //   if (menuError) {
  //     alert(menuError.message);
  //     return;
  //   }

  //   const storeId = menu.store_id;

  //   // 4) เช็คว่า order นี้มี store นี้ไหม
  //   const { data: orderStore, error: orderStoreError } = await supabase
  //     .from("order_stores")
  //     .select("id")
  //     .eq("order_id", orderId)
  //     .eq("store_id", storeId)
  //     .maybeSingle();

  //   if (orderStoreError) {
  //     alert(orderStoreError.message);
  //     return;
  //   }

  //   let orderStoreId = orderStore?.id;

  //   // 5) ถ้ายังไม่มี → สร้าง order_store
  //   if (!orderStoreId) {
  //     const { data: newOrderStore, error: newOrderStoreError } = await supabase
  //       .from("order_stores")
  //       .insert({
  //         order_id: orderId,
  //         store_id: storeId,
  //         store_total:price,
  //         status: "cart",
  //       })
  //       .select("id")
  //       .single();

  //     if (newOrderStoreError) {
  //       alert(newOrderStoreError.message);
  //       return;
  //     }

  //     orderStoreId = newOrderStore.id;
  //   }

  //   // 6) เช็ค menu ใน cart
  //   const { data: item, error: itemError } = await supabase
  //     .from("orders_details")
  //     .select("id, quantity")
  //     .eq("order_stores_id", orderStoreId)
  //     .eq("menu_id", menuId)
  //     .maybeSingle();

  //   if (itemError) {
  //     alert(itemError.message);
  //     return;
  //   }

  //   // 7) เพิ่มจำนวน
  //   if (item) {
  //     const { error: updateError } = await supabase
  //       .from("orders_details")
  //       .update({
  //         quantity: item.quantity + 1,
  //         subtotal: (item.quantity + 1) * price,
  //       })
  //       .eq("id", item.id);

  //     if (updateError) {
  //       alert(updateError.message);
  //       return;
  //     }
  //   } else {
  //     const { error: insertError } = await supabase
  //       .from("orders_details")
  //       .insert({
  //         order_stores_id: orderStoreId,
  //         menu_id: menuId,
  //         quantity: 1,
  //         price: price,
  //         subtotal: price,
  //       });

  //     if (insertError) {
  //       alert(insertError.message);
  //       return;
  //     }
  //   }

  //   // 8) คำนวณ total ของ order
  //   const { data: total, error: totalError } = await supabase
  //     .from("orders_details")
  //     .select("subtotal");

  //   if (totalError) {
  //     alert(totalError.message);
  //     return;
  //   }

  //   const totalsub = total.reduce((sum, row) => sum + row.subtotal, 0);

  //   await supabase
  //     .from("orders")
  //     .update({ total_price: totalsub })
  //     .eq("id", orderId);

  //   alert("เพิ่มลงตะกร้าแล้ว 🛒");
  // }

  //console.log(menuCate);

  return (
    <div>
      <div className={styles.top}>
        <Image
          src={store.image_url || "/miko.jpg"}
          fill
          alt="bgshop"
          className={styles.imagestore}
        />
        <div className={styles.top_name}>
          <h2>{store.name}</h2>
          <p>{store.description}</p>
        </div>
        <Link className={styles.backshop} href="/">
          ⬅
        </Link>
      </div>
      <div className={styles.category}>
        <button
          onClick={() => setMenuCate(null)}
          className={menuCate === null ? styles.active : ""}
        >
          ทั้งหมด
        </button>
        {menuc?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => cate(cat.id)}
            className={menuCate === cat.id ? styles.active : ""}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className={styles.listmenu}>
        <h2>Menu</h2>
        <div className={styles.menu}>
          {sortedMenus.length > 0 &&
            sortedMenus.map((menu) => {
              return (
                <div
                  key={menu.id}
                  onClick={() => {
                    setShowModal(true);
                    setSelectedMenu(menu);
                  }}
                  style={{cursor:"pointer"}}
                >
                  <div className={styles.card}>
                    <div className={styles.cardimage}>
                      <Image
                        src={menu.image_url || "/iconmain.png"}
                        fill
                        alt={menu.name}
                        className={styles.imagemenu}
                      />
                    </div>

                    <div className={styles.carddetail}>
                      <div>
                        <h4>{menu.name}</h4>

                        <span>{menu.description}</span>
                      </div>
                      <div className={styles.carddetail_price}>
                        <span>{menu.price} บาท</span>
                      </div>
                    </div>

                    {/* <div className={styles.addmenu}>
                      <button className={styles.minus}>-</button>
                      {user ? (
                        <button
                          className={styles.add}
                            onClick={() => addToOrder(menu.id, menu.price)}
                        >
                          +
                        </button>
                      ) : (
                        <></>
                      )}
                    </div> */}
                  </div>
                </div>
              );
            })}
        </div>
        {menus.length === 0 && (
          <div className={styles.nomenu}>ยังไม่มีเมนูในร้านนี้</div>
        )}
      </div>

      <div className={styles.bottom}>
        <Link href="/" className={styles.back}>
          ⬅ กลับ
        </Link>
        <Link href="/ordercart" className={styles.cart}>
          🛒 My cart{" "}
        </Link>
      </div>

      {showModal && (
        <ModalOrder
          setShowModal={setShowModal}
          selectedMenu={selectedMenu}
          setSelectedMenu={setSelectedMenu}
          note={note}
          setNote={setNote}
          countAdd={countAdd}
          setCountAdd={setCountAdd}
          user={user}
          supabase={supabase}
          store={store}
        />
      )}
    </div>
  );
}
