"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/wallet/walletPage.module.css";
import { useState, useEffect } from "react";
import ModalTran from "./ModalTran";
import { supabase } from "@/lib/supabaseClient";
export default function walletPageClient() {
  const [wallet, setWallet] = useState(null);
  const [wallet_tran, setWallet_tran] = useState(null);
  const [user, setUser] = useState(null);
  const [modalTran, setModalTran] = useState(false);
  const [selectTran, setSelectTran] = useState(null);
  const [uid, setUid] = useState(false);
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

      const { data: wt, error: wterror } = await supabase
        .from("wallet_transactions")
        .select(
          "*,orders(order_stores(store_total,status,orders_details(*,menus(name))))",
        )
        .eq("user_id", user.id)
        .eq("orders.order_stores.status", "finished");
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
              <div
                className={styles.studentid}
                onClick={() => setUid((prev) => !prev)}
              >
                UID
              </div>
              {uid && <span>{wallet.user_id}</span>}
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
        {wallet_tran?.map((tran) => (
          <div
            key={tran.id}
            className={styles.historyCard}
            onClick={() => {
              setModalTran(true);
              setSelectTran(tran);
            }}
            style={{ cursor: "pointer" }}
          >
            {/* 🔵 left icon */}
            <div
              className={`${styles.icon} ${
                tran.type === "income" ? styles.income : styles.expense
              }`}
            >
              {tran.type === "income" ? "💰" : "💸"}
            </div>

            {/* 🧾 middle detail */}
            <div className={styles.detail}>
              <span className={styles.title}>
                {tran.type === "income" ? "ได้รับเงิน" : "ชำระเงิน"}
              </span>

              <span className={styles.order}>Order #{tran.order_id}</span>

              <span className={styles.time}>
                {new Date(tran.created_at).toLocaleString("th-TH")}
              </span>
            </div>

            {/* 💵 right amount */}
            <div
              className={`${styles.amount} ${
                tran.type === "income" ? styles.plus : styles.minus
              }`}
            >
              {tran.type === "income" ? "+" : "-"}฿
              {tran.amount.toLocaleString("th-TH")}
            </div>
          </div>
        ))}
      </div>

      {modalTran && (
        <ModalTran
          setModalTran={setModalTran}
          selectTran={selectTran}
          setSelectTran={setSelectTran}
        />
      )}
    </div>
  );
}
