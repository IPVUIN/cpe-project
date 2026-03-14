"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./ModalOrder.module.css";

export default function ModalOrder({
  setShowModal,
  selectedMenu,
  setSelectedMenu,
  note,
  setNote,
  countAdd,
  setCountAdd,
  user,
  supabase,
  store,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function count(value) {
    setCountAdd((prev) => prev + value);
  }

  async function addToOrder(menu, qty, note) {
    const { data: orderCart, error: orderCartError } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user?.id)
      .eq("status", "cart")
      .maybeSingle();
    console.log("OldOrderCart :  ", orderCart, menu);
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
          //   store_id: store.id,
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
      console.log("NewOrderCart :  ", newOrder, menu);
    }

    // 3️⃣ หา order_stores ของร้านนี้
    const { data: existingOrderStore, error: orderStoreError } = await supabase
      .from("order_stores")
      .select("id")
      .eq("order_id", orderId)
      .eq("store_id", menu.store_id)
      .maybeSingle();

    if (orderStoreError) {
      alert(orderStoreError.message);
      return;
    }

    let orderStoreId = existingOrderStore?.id;

    // 4️⃣ ถ้ายังไม่มีร้านนี้ใน order → สร้าง
    if (!orderStoreId) {
      const { data: newOrderStore, error: newOrderStoreError } = await supabase
        .from("order_stores")
        .insert({
          order_id: orderId,
          store_id: menu.store_id,
          status: "cart",
          store_total: 0,
        })
        .select("id")
        .single();

      if (newOrderStoreError) {
        alert(newOrderStoreError.message);
        return;
      }

      orderStoreId = newOrderStore.id;
    }

    // 5️⃣ เพิ่ม menu เข้า orders_details
    const { error: detailError } = await supabase
      .from("orders_details")
      .insert({
        order_stores_id: orderStoreId,
        menu_id: menu.id,
        quantity: qty,
        price: menu.price,
        subtotal: menu.price * qty,
        note: note,
      });

    if (detailError) {
      alert(detailError.message);
      return;
    }

    // 6️⃣ update store_total
    const { data: storeDetails } = await supabase
      .from("orders_details")
      .select("subtotal")
      .eq("order_stores_id", orderStoreId);

    const storeTotal = storeDetails.reduce((sum, row) => sum + row.subtotal, 0);

    await supabase
      .from("order_stores")
      .update({ store_total: storeTotal })
      .eq("id", orderStoreId);

    // 7️⃣ update order total
    const { data: orderDetails } = await supabase
      .from("orders_details")
      .select("subtotal, order_stores(order_id)")
      .eq("order_stores.order_id", orderId);

    const orderTotal = orderDetails.reduce((sum, row) => sum + row.subtotal, 0);

    await supabase
      .from("orders")
      .update({ total_price: orderTotal })
      .eq("id", orderId);

    console.log("เพิ่มเมนูสำเร็จ");
    alert("เพิ่มเมนูสำเร็จ");
  }

  if (!mounted) return null;

  return (
    <Modal>
      <div className={styles.Modal}>
        <div className={styles.modalDetail}>
          <button
            onClick={() => {
              setShowModal(false);
              setSelectedMenu(null);
              setCountAdd(1);
            }}
            className={styles.btnClose}
          >
            X
          </button>

          <div className={styles.modalDetailhead}>
            <h3>{selectedMenu.name}</h3>
            <span>{selectedMenu.price} บาท</span>
          </div>

          <div className={styles.modalDetailtext}>
            <textarea
              placeholder="หมายเหตุ เช่น ไม่เอาผัก"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.modalBottomMenu}>
          <div className={styles.modalMark}>
            <button onClick={() => count(-1)} disabled={countAdd === 0}>
              -
            </button>

            {countAdd}
            <button onClick={() => count(1)}>+</button>
          </div>
          <button
            onClick={() => {
              addToOrder(selectedMenu, countAdd, note);
              //  setOpenModal(false);
            }}
            className={styles.btnadd}
            disabled={countAdd === 0}
          >
            เพิ่มลงตะกร้า
          </button>
        </div>
      </div>
    </Modal>
  );
}
