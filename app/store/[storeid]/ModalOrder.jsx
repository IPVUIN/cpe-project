"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./ModalOrder.module.css";
import { useCart } from "@/contexts/CartContext";
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
  const [selectedOptions, setSelectedOptions] = useState({});
  const { setCartCount } = useCart();
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedMenu?.options_config) return;

    const defaults = {};

    selectedMenu.options_config.forEach((opt) => {
      defaults[opt.name] = opt.default || opt.choices[0];
    });

    setSelectedOptions(defaults);
  }, [selectedMenu]);
  const basePrice = selectedMenu.price;
  const extraPrice = Object.values(selectedOptions).reduce(
    (sum, opt) => sum + (opt.price || 0),
    0,
  );
  const finalPrice = basePrice + extraPrice;
  console.log("f", selectedMenu.price);
  function count(value) {
    setCountAdd((prev) => prev + value);
  }

  async function addToOrder(menu, qty, note, price, option) {
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
          total_price: price,
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
        price: price,
        subtotal: price * qty,
        note: note,
        option: option,
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
      .select(
        `
    subtotal,
    order_stores!inner(order_id)
  `,
      )
      .eq("order_stores.order_id", orderId);
    const orderTotal = orderDetails.reduce((sum, row) => sum + row.subtotal, 0);
    await supabase
      .from("orders")
      .update({ total_price: orderTotal })
      .eq("id", orderId);

    console.log("เพิ่มเมนูสำเร็จ");
    alert("เพิ่มเมนูสำเร็จ");
    setShowModal(false);
    setCartCount((prev) => prev + qty);
  }

  function handleSelect(optionName, choice) {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: choice, // เก็บทั้ง object
    }));
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
              setNote("");
            }}
            className={styles.btnClose}
          >
            X
          </button>

          <div className={styles.modalDetailhead}>
            <h3>{selectedMenu.name}</h3>
            <span>{finalPrice} บาท</span>
          </div>
          <hr />
          {selectedMenu.options_config?.map((opt) => (
            <div key={opt.name}>
              <span>{opt.label}</span>
              <br />

              <div className={styles.choice}>
                {opt.choices.map((c, i) => (
                  <div className={styles.radio} key={`${opt.name}-${i}`}>
                    {" "}
                    <label >
                      <input
                        type="radio"
                        name={opt.name}
                        checked={selectedOptions[opt.name]?.label === c.label}
                        onChange={() => handleSelect(opt.name, c)}
                      />
                      {c.label} {c.price > 0 && `+${c.price}฿`}
                    </label>
                  </div>
                ))}
              </div>

              <hr />
            </div>
          ))}

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
              addToOrder(
                selectedMenu,
                countAdd,
                note,
                finalPrice,
                selectedOptions,
              );
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
