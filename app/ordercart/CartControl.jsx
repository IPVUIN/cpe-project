"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/ordercart/orderCartPage.module.css";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
export default function CartControl({
  supabase,
  item,
  setOrdersCart,
  ordersCart,
  storeId,
}) {
  //   const [countMenu, setCountMenu] = useState(item.quantity);
  //   const [subMenu, setSubMenu] = useState(item.subtotal);
  const { setCartCount } = useCart();
  async function updateQty(id, qty, price, storeId, delta) {
    const newQty = qty + delta;
    const newSubtotal = newQty * price;

    let newStoreTotal = 0;
    let newOrderTotal = 0;

    setOrdersCart((prev) => {
      const updatedStores = prev.order_stores.map((store) => {
        if (store.id !== storeId) return store;

        const newDetails = store.orders_details.map((item) =>
          item.id === id
            ? { ...item, quantity: newQty, subtotal: newSubtotal }
            : item,
        );

        newStoreTotal = newDetails.reduce((sum, i) => sum + i.subtotal, 0);

        return {
          ...store,
          orders_details: newDetails,
          store_total: newStoreTotal,
        };
      });

      newOrderTotal = updatedStores.reduce((sum, s) => sum + s.store_total, 0);

      return {
        ...prev,
        order_stores: updatedStores,
        total_price: newOrderTotal,
      };
    });

    // update orders_details
    await supabase
      .from("orders_details")
      .update({
        quantity: newQty,
        subtotal: newSubtotal,
      })
      .eq("id", id);

    // update store_total
    await supabase
      .from("order_stores")
      .update({ store_total: newStoreTotal })
      .eq("id", storeId);

    // update order_total
    await supabase
      .from("orders")
      .update({ total_price: newOrderTotal })
      .eq("id", ordersCart.id);

    setCartCount((prev) => prev + delta);
  }

  async function removeItem(id) {
    let newStoreTotal = 0;
    let newOrderTotal = 0;

    setOrdersCart((prev) => {
      const updatedStores = prev.order_stores
        .map((store) => {
          if (store.id !== storeId) return store;

          const newDetails = store.orders_details.filter(
            (item) => item.id !== id,
          );

          newStoreTotal = newDetails.reduce(
            (sum, item) => sum + item.subtotal,
            0,
          );

          return {
            ...store,
            orders_details: newDetails,
            store_total: newStoreTotal,
          };
        })
        .filter((store) => store.orders_details.length > 0);
      newOrderTotal = updatedStores.reduce((sum, s) => sum + s.store_total, 0);

      return {
        ...prev,
        order_stores: updatedStores,
        total_price: newOrderTotal,
      };
    });

    // ลบจาก database
    await supabase.from("orders_details").delete().eq("id", id);

    // 2️⃣ เช็คว่ายังมีเมนูในร้านนี้ไหม
    const { data: remaining } = await supabase
      .from("orders_details")
      .select("id")
      .eq("order_stores_id", storeId);

    if (remaining.length === 0) {
      // 3️⃣ ถ้าไม่มีเมนูแล้ว ลบร้านออก
      await supabase.from("order_stores").delete().eq("id", storeId);
    } else {
      // 4️⃣ ถ้ายังมีเมนู อัปเดต store_total
      await supabase
        .from("order_stores")
        .update({ store_total: newStoreTotal })
        .eq("id", storeId);
    }

    // update order_total
    await supabase
      .from("orders")
      .update({ total_price: newOrderTotal })
      .eq("id", ordersCart.id);

    setCartCount((prev) => prev - 1);
  }

  return (
    <>
      <div className={styles.menuRow}>
        {/* LEFT */}
        <div className={styles.menuInfo}>
          <p className={styles.name}>
            {item.menus?.name}{" "}
            {item.note && <span className="note">{item.note}</span>}
          </p>
          {item.option &&
            Object.values(item.option).map((opt, i) => (
              <span key={i} className="option">
                {opt.label === "ไม่เพิ่ม" ? "" : `- ${opt.label}`}
              </span>
            ))}{" "}
          <span className={styles.sub}>฿{item.price}</span>
        </div>

        {/* RIGHT */}
        <div className={styles.menuRight}>
          <span className={styles.subtotal}>฿{item.subtotal}</span>

          <div className={styles.qtyControl}>
            {item.quantity > 1 ? (
              <button
                onClick={() =>
                  updateQty(
                    item.id,
                    item.quantity,
                    item.menus.price,
                    item.order_stores_id,
                    -1,
                  )
                }
                className={styles.minus}
              >
                -
              </button>
            ) : (
              <button
                onClick={() =>
                  confirm("ต้องการลบรายการนี้ใช่ไหม?") && removeItem(item.id)
                }
                className={styles.minus}
              >
                -
              </button>
            )}

            <span className={styles.qty}>{item.quantity}</span>

            <button
              onClick={() =>
                updateQty(
                  item.id,
                  item.quantity,
                  item.menus.price,
                  item.order_stores_id,
                  1,
                )
              }
              className={styles.add}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
