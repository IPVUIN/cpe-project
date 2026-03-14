"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/ordercart/orderCartPage.module.css";
import { useState, useEffect } from "react";
export default function CartControl({ supabase, item, loadOrders }) {
//   const [countMenu, setCountMenu] = useState(item.quantity);
//   const [subMenu, setSubMenu] = useState(item.subtotal);
  async function increase(id, qty, price) {
    const { data, error } = await supabase
      .from("orders_details")
      .update({
        quantity: qty + 1,
        subtotal: (qty + 1) * price,
      })
      .select("quantity,subtotal")
      .eq("id", id)
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    await loadOrders();
    //   console.log("increase", data);
  }
  async function minus(id, qty, price) {
    const { data, error } = await supabase
      .from("orders_details")
      .update({
        quantity: qty - 1,
        subtotal: (qty - 1) * price,
      })
      .select("quantity,subtotal")
      .eq("id", id)
      .single();
    if (error) {
      alert(error.message);
      return;
    }
   await loadOrders();
  }

  return (
    <>
      <span className={styles.order_cart_menu}>
        {item.menus.name} x{item.quantity}
        <div className={styles.order_cart_menu_end}>
          <span>{item.subtotal} บาท</span>
          {item.quantity > 1 ? (
            <button
              onClick={() => minus(item.id, item.quantity, item.menus.price)}
              className={styles.minus}
            >
              -
            </button>
          ) : (
            <button
              //  onClick={() => Delmenu(item.id, item.menus.price, store.id)}
              className={styles.del}
            >
              <div className={styles.divDel}>
                <Image
                  src="/trash.png"
                  className={styles.image}
                  fill
                  alt="image_del"
                />
              </div>
            </button>
          )}
          <button
            onClick={() => increase(item.id, item.quantity, item.menus.price)}
            className={styles.add}
          >
            +
          </button>{" "}
        </div>{" "}
      </span>
    </>
  );
}
