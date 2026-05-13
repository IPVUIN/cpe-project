"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/wallet/walletPage.module.css";
import { useState, useEffect } from "react";
import ModalTran from "./ModalTran";
import ModalPP from "./ModalPP";
import { supabase } from "@/lib/supabaseClient";
export default function walletPageClient() {
  const [wallet, setWallet] = useState(null);
  const [wallet_tran, setWallet_tran] = useState(null);
  const [user, setUser] = useState(null);
  const [modalTran, setModalTran] = useState(false);
  const [selectTran, setSelectTran] = useState(null);
  const [uid, setUid] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [modalPP, setModalPP] = useState(false);
  const [qr, setQr] = useState(null);
  const [topupId, setTopupId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
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
        .eq("orders.order_stores.status", "finished")
        .order("created_at", { ascending: false });
      if (!wterror) setWallet_tran(wt);
    }
    loadWallet();
  }, [user]);

  const history = wallet_tran?.filter((item) => {
    if (item.type === "topup") return true;

    return item.orders?.order_stores?.some(
      (store) => store.status === "finished",
    );
  });
  // async function topup(amount) {
  //   const { data: walletData, error } = await supabase
  //     .from("wallet")
  //     .select("*")
  //     .eq("user_id", user.id)
  //     .single();

  //   if (error) {
  //     alert("โหลด wallet ไม่สำเร็จ");
  //     return;
  //   }

  //   const { data: updatedWallet, error: updateErr } = await supabase
  //     .from("wallet")
  //     .update({
  //       balance: walletData.balance + amount,
  //     })
  //     .eq("user_id", user.id)
  //     .select()
  //     .single();

  //   if (updateErr) {
  //     alert("เติมเงินไม่สำเร็จ");
  //     return;
  //   }

  //   setWallet(updatedWallet);
  // }

  // console.log("wallet", wallet);
  // console.log("wallet t", wallet_tran);

  const topup = async (amount) => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      setLoading(false);
      return;
    }
    if (amount < 50) {
      alert("ยอดเติมขั้นต่ำ 50 บาท");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/topup/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        user_id: user.id,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert("สร้างรายการเติมเงินไม่สำเร็จ");
      console.log(data);
      return;
    }

    setQr(data.qr_url);
    setTopupId(data.topup_id);
  };

  useEffect(() => {
    if (!topupId) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/topup/status?id=${topupId}`);
      const data = await res.json();

      if (data.status === "success") {
        alert("เติมเงินสำเร็จ");
        setQr(null);
        setTopupId(null);
        window.location.reload();
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [topupId]);
  if (!user) return <div>กำลังโหลด...</div>;

  if (user.role !== "customer") {
    return <div>ไม่มีสิทธิ์</div>;
  }
  if (!mounted) return null;
  return (
    <div>
      <h1>💸 กระเป๋าเงินของฉัน</h1>

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

      <h3>เติมเงิน</h3>
      <div className={styles.quicktopup}>
        <div
          className={styles.topup}
          onClick={() => {
            topup(50);
            setModalPP(true);
          }}
        >
          ฿50
        </div>
        <div
          className={styles.topup}
          onClick={() => {
            topup(100);
            setModalPP(true);
          }}
        >
          ฿100
        </div>
        <div
          className={styles.topup}
          onClick={() => {
            topup(200);
            setModalPP(true);
          }}
        >
          ฿200
        </div>
        <div className={styles.customTopup}>
          <input
            type="number"
            placeholder="ใส่จำนวนเงิน"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className={styles.input}
          />

          <button
            className={styles.topupBtn}
            onClick={() => {
              const amount = Number(customAmount);

              if (!amount || amount < 50) {
                alert("ขั้นต่ำ 50 บาท");
                return;
              }

              topup(amount);
              setModalPP(true);
            }}
          >
            เติมเงิน
          </button>
        </div>
      </div>

      {modalPP && (
        <ModalPP
          setModalPP={setModalPP}
          loading={loading}
          qr={qr}
          topupId={topupId}
          setTopupId={setTopupId}
          setQr={setQr}
        />
      )}

      <h3>ประวัติธุรกรรม</h3>
      <div className={styles.history}>
        {history?.map((tran) => {
          const isTopup = tran.type === "topup";

          return (
            <div
              key={tran.id}
              className={styles.historyCard}
              onClick={() => {
                if (isTopup) return; // ❌ ไม่ให้กดถ้าเป็นเติมเงิน
                setModalTran(true);
                setSelectTran(tran);
              }}
              style={{ cursor: isTopup ? "default" : "pointer" }}
            >
              {/* 🔵 left icon */}
              <div
                className={`${styles.icon} ${
                  isTopup ? styles.income : styles.expense
                }`}
              >
                {isTopup ? "💰" : "💸"}
              </div>

              {/* 🧾 middle detail */}
              <div className={styles.detail}>
                <span className={styles.title}>
                  {isTopup ? "เติมเงิน" : "ชำระเงิน"}
                </span>

                {/* เติมเงินไม่ต้องมี order */}
                {!isTopup && (
                  <span className={styles.order}>Order #{tran.order_id}</span>
                )}

                <span className={styles.time}>
                  {new Date(tran.created_at).toLocaleString("th-TH")}
                </span>
              </div>

              {/* 💵 right amount */}
              <div
                className={`${styles.amount} ${
                  isTopup ? styles.plus : styles.minus
                }`}
              >
                {isTopup ? "+" : "-"}฿{tran.amount.toLocaleString("th-TH")}
              </div>
            </div>
          );
        })}
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
