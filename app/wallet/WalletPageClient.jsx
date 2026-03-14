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
  const [mounted, setMounted] = useState(false);
  //const [balance, setB] = useState(null);
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
    }
    loadUser();
  }, []);
  useEffect(() => {
    if (!user) return;
    async function loadWallet() {
      const { data: wallet } = await supabase
        .from("wallet")
        .select("user_id,balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) {
        setWallet(wallet);
      }

      const { data: wt, error: wterror } = await supabase.from(
        "wallet_transactions",
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
  }, [user]);

  async function topup(amount) {
    const { data: walletData, error } = await supabase
      .from("wallet")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      alert("โหลด wallet ไม่สำเร็จ");
      return;
    }

    const { data: updatedWallet, error: updateErr } = await supabase
      .from("wallet")
      .update({
        balance: walletData.balance + amount,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateErr) {
      alert("เติมเงินไม่สำเร็จ");
      return;
    }


    setWallet(updatedWallet);
  }

  console.log("wallet", wallet);
  console.log("wallet t", wallet_tran);
  if (!user) return <div>กำลังโหลด...</div>;

  if (user.role !== "customer") {
    return <div>ไม่มีสิทธิ์</div>;
  }
  if (!mounted) return null;
  return (
    <div>
      <h1>💸 My wallet</h1>

      <div className={styles.profile}>
        {wallet ? (
          <>
            <div className={styles.balance}>
              <span>ยอดเงินปัจจุบัน</span>
              <h1>฿{wallet.balance}</h1>
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
        <div className={styles.topup} onClick={() => topup(10)}>
          ฿10
        </div>
        <div className={styles.topup} onClick={() => topup(50)}>
          ฿50
        </div>
        <div className={styles.topup} onClick={() => topup(100)}>
          ฿100
        </div>
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

                  <div className={styles.history_amount}>- ฿{item.amount}</div>
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
