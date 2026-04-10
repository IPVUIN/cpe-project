"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./modalOrder.module.css";

export default function ModalOrder({
  setModalOrder,
  selectOrder,
  setSelectOrder,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  console.log(selectOrder.orders.order_stores);
  return (
    <Modal>
      <div className={styles.order}>
        {/* 🔴 Header */}
        <div className={styles.modalHeader}>
          <div>
            <h3>รายละเอียดออเดอร์</h3>
            <span className={styles.orderId}>#{selectOrder?.order_id}</span>
          </div>

          <button
            onClick={() => {
              setModalOrder(false);
              setSelectOrder(null);
            }}
            className={styles.btnClose}
          >
            ✕
          </button>
        </div>
        {/* 💰 Summary */}
        <div className={styles.summary}>
          <span>ยอดเงินที่ได้รับ</span>
          <h2>
            ฿{selectOrder?.orders?.order_stores.map((os) => `${os.store_total}`)}
          </h2>
          <span className={styles.time}>
            {new Date(selectOrder?.created_at).toLocaleString("th-TH")}
          </span>
        </div>

        {/* 🍜 รายการอาหาร */}
        <div className={styles.menuList}>
          {selectOrder?.orders.order_stores.map((os) =>
            os.orders_details.map((item) => (
              <div key={item.id} className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <span className={styles.menuName}>
                    {item.menus?.name}{" "}
                    <span className={styles.menuQty}>x{item.quantity}</span>
                  </span>

                  {/* 🔥 options */}
                  {item.option &&
                    Object.values(item.option)
                      .filter((opt) => opt.label !== "ไม่เพิ่ม")
                      .map((opt, i) => (
                        <div key={i} className={styles.option}>
                          - {opt.label}
                          {opt.price > 0 && ` (+${opt.price}฿)`}
                        </div>
                      ))}

                  {/* 📝 note */}
                  {item.note && (
                    <div className={styles.note}>📝 {item.note}</div>
                  )}
                </div>

                <div className={styles.menuRight}>
                  ฿{item.subtotal.toLocaleString("th-TH")}
                </div>
              </div>
            )),
          )}
        </div>

        {/* 🔚 Footer */}
        <div className={styles.modalFooter}>
          <button
            onClick={() => setModalOrder(false)}
            className={styles.btnCloseBottom}
          >
            ปิด
          </button>
        </div>
      </div>
    </Modal>
  );
}
