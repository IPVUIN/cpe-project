"use client";

import styles from "@/app/myStore/myStorePage.module.css";
import Link from "next/link";

//import { startTransition } from "react";

export default function MyStorePageClient() {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.top_name}>
            <h1>Soft Drink </h1>
            <span className={styles.top_under_name}>ยินดีต้อนรับ...</span>
          </div>
        </div>
        <h3>Incomming orders</h3>
        <div className={styles.order_lists}>
          <div className={styles.order}>
            <div className={styles.order_text}>
              <div className={styles.order_left}>
                <div style={{ display: "flex", marginBottom: "5px" }}>
                  <h4>Order #101</h4>
                  <span>14/01/2547</span>
                </div>

                <div>2x Classic Burger, 1x Fries</div>
              </div>
              <div>100 บาท</div>
            </div>
            <div className={styles.order_bottom}>
              <button className={styles.accept}>Accept</button>{" "}
              <button className={styles.reject}>Reject</button>
            </div>
          </div>

          <div className={styles.order}>
            <div className={styles.order_text}>
              <div className={styles.order_left}>
                <div style={{ display: "flex", marginBottom: "5px" }}>
                  <h4>Order #101</h4>
                  <span>14/01/2547</span>
                </div>

                <div>2x Classic Burger, 1x Fries</div>
              </div>
              <div>100 บาท</div>
            </div>
            <div className={styles.order_bottom}>
              <button className={styles.accept}>Accept</button>{" "}
              <button className={styles.reject}>Reject</button>
            </div>
          </div>

          <div className={styles.order}>
            <div className={styles.order_text}>
              <div className={styles.order_left}>
                <div style={{ display: "flex", marginBottom: "5px" }}>
                  <h4>Order #101</h4>
                  <span>14/01/2547</span>
                </div>

                <div>2x Classic Burger, 1x Fries</div>
              </div>
              <div>100 บาท</div>
            </div>
            <div className={styles.order_bottom}>
              <button className={styles.accept}>Accept</button>{" "}
              <button className={styles.reject}>Reject</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
