"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/AdminEditshop/[storeid]/AdminEditshop.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function AdminEditshop({ store, menus, menusCate }) {
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
  console.log("s", sortedMenus);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    setMenuc(menusCate);
  }, [menusCate]);

  function cate(catId) {
    setMenuCate(catId);
  }

  console.log(store.id);
  async function addToOrder(menuId, price) {
    const { data: orderCart, error: orderCartError } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "cart")
      .maybeSingle();
    console.log("orderCart :  ", orderCart);
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
          store_id: store.id,
          status: "cart",
          total_price: price,
        })
        .select("id")
        .single();
      if (newOrderError) {
        alert(newOrderError.message);
        return;
      }

      orderId = newOrder.id;
    }
    console.log("newOrder : ", orderId);
    const { data: newMenu, error: newMenuError } = await supabase
      .from("menus")
      .select("store_id")
      .eq("id", menuId)
      .single();
    if (newMenuError) {
      alert(newMenuError.message);
      return;
    }
    console.log("NEWMENU:", newMenu);
    //  console.log("store:", newOrder);
    const { data: storeIdOrder, error: storeIdOrderError } = await supabase
      .from("orders")
      .select("store_id")
      .eq("id", orderId)
      .single();
    if (storeIdOrderError) {
      alert(storeIdOrderError.message);
      return;
    }
    console.log("store:", storeIdOrder);

    const { data: item, error: itemError } = await supabase
      .from("orders_details")
      .select("menu_id, quantity")
      .eq("order_id", orderId)
      .eq("menu_id", menuId)
      .maybeSingle();

    if (itemError) {
      alert(itemError.message);
      return;
    }

    // 5) quantity + 1
    if (item) {
      const { data: update, error: updateError } = await supabase
        .from("orders_details")
        .update({
          quantity: item.quantity + 1,
          subtotal: (item.quantity + 1) * price,
        })
        .eq("order_id", orderId) //
        .eq("menu_id", menuId)
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
            menu_id: menuId,
            quantity: 1,
            price: price,
            subtotal: price,
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
      .select("subtotal")
      .eq("order_id", orderId);

    if (totalError) {
      alert(totalError.message);
      return;
    }
    console.log("TOTAL", total);
    const totalsub = total.reduce((sum, row) => sum + row.subtotal, 0);
    console.log("totalsub", totalsub);
    const { error: orderError } = await supabase
      .from("orders")
      .update({ total_price: totalsub })
      .eq("id", orderId);

    if (orderError) {
      alert(orderError.message);
      return;
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Image
          src={store?.image_url || "/miko.jpg"}
          fill
          alt=""
          className={styles.imagestore}
        />
        <div className={styles.top_name}>
          <h2>{store.name}</h2>
          <p>{store.description}</p>
        </div>
        <Link className={styles.backshop} href="/adminstoremanage">
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
                <div key={menu.id}>
                  <div className={styles.card}>
                    <div className={styles.cardimage}>
                      <Image
                        src="/cutlery.png"
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

                    <div className={styles.addmenu}>
                      {/* <button className={styles.minus}>-</button> */}
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
                    </div>
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
    </div>
  );
}
