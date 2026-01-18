"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/wallet/walletPage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function walletPageClient() {
  const [wallet, setWallet] = useState(null);
  const [wallet_tran, setWallet_tran] = useState(null);
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);
  useEffect(() => {
    async function loadWallet() {
      const { data, error } = await supabase
        .from("wallet")
        .select("user_id,balance")
        .single();

      if (!error) setWallet(data);
      const { data: wt, error: wterror } = await supabase.from(
        "wallet_transactions"
      ).select(`
    id,
    order_id,
    amount,
    description,
    created_at,
    type,
    orders (
      id,
      stores (
        id,
        name,
        image_url
      )
    )
  `);

      if (!wterror) setWallet_tran(wt);
    }
    loadWallet();
  }, []);

  if (user === null) {
    return <div className={"nologin"}>โปรดเข้าสู่ระบบ...</div>;
  }

  console.log("wallet", wallet);
  console.log("wallet t", wallet_tran);
  return (
    <div className={styles.container}>
      <h1>💸 My wallet</h1>

      <div className={styles.profile}>
        {wallet ? (
          <>
            <div className={styles.balance}>
              <span>Current Balance</span>
              <h1>{wallet.balance} บาท</h1>
            </div>

            <div className={styles.uid}>
              <span>{wallet.user_id}</span>
              <div className={styles.studentid}>UID</div>
            </div>
          </>
        ) : (
          <span>กำลังโหลดข้อมูล</span>
        )}
      </div>

      <h3>Quick Top-up</h3>
      <div className={styles.quicktopup}>
        <div className={styles.topup}>10</div>
        <div className={styles.topup}>50</div>
        <div className={styles.topup}>100</div>
      </div>

      <h3>History</h3>
      <div className={styles.history}>
        {wallet_tran && wallet_tran.length > 0 ? (
          wallet_tran
            .sort((a, b) => b.id - a.id)
            .map((item) => (
              <div key={item.id} className={styles.history_card}>
                <div className={styles.divimage}>
                  {" "}
                  <Image
                    className={styles.image}
                    src={item.orders.stores.image_url}
                    fill
                    alt={item.id}
                  />
                </div>

                <div className={styles.history_text}>
                  <div className={styles.history_name}>
                    <h3>{item.orders?.stores?.name}</h3>
                    <span>Order#{item.orders.id}</span>
                    <span>
                      {new Date(item.created_at).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>

                  <div className={styles.history_amount}>
                    -{item.amount} บาท
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className={styles.notran}>ไม่มีรายการธุรกรรม</div>
        )}
      </div>
    </div>
  );
}
