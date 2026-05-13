"use client";

import styles from "@/app/storewallet/storeWalletPage.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import timeAgo from "@/lib/time_ago";
import ModalSlip from "./ModalSlip";
import ModalReq from "./ModalReq";
import ModalOrder from "./ModalOrder";
import Image from "next/image";
//import { startTransition } from "react";

export default function StoreWalletPage() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [walletT, setWalletT] = useState(null);
  const [bank, setBank] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [editBank, setEditBank] = useState("");
  const [editName, setEditName] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const [uid, setUid] = useState(false);
  const [exchange, setExchange] = useState(null);
  const [approved, setApproved] = useState(null);
  const [exSel, setExSel] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalReq, setModalReq] = useState(false);

  const [myOrders, setMyOrders] = useState(null);
  const [modalOrder, setModalOrder] = useState(false);
  const [selectOrder, setSelectOrder] = useState(null);

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

      const { data: wallet } = await supabase
        .from("wallet")
        .select("*")
        .eq("user_id", auth.user.id)
        .single();
      setWallet(wallet);

      const { data: wallet_t } = await supabase
        .from("wallet_transactions")
        .select(
          "*,orders(order_stores(store_total,orders_details(*,menus(name))))",
        )
        .order("id", { ascending: false })
        .eq("user_id", auth.user.id);
      setWalletT(wallet_t);
      const { data: store } = await supabase
        .from("stores")
        .select("id,name,user_id")
        .eq("user_id", auth.user.id)
        .single();

      setStoreId(store);
    }
    loadUser();
  }, []);
  console.log(walletT);
  useEffect(() => {
    async function loadBank() {
      const { data: bank } = await supabase
        .from("bank")
        .select("*")
        .order("id");
      setBank(bank);
    }
    loadBank();
  }, []);

  useEffect(() => {
    async function loadExchange() {
      if (!storeId?.id) return;
      const { data: ex } = await supabase
        .from("exchange_request")
        .select(`*,bank(*)`)
        .eq("store_id", storeId?.id)
        .neq("status", "approved")
        .order("created_at", { ascending: false });
      // .order("id");
      setExchange(ex);
      const { data: app } = await supabase
        .from("exchange_request")
        .select(`*,bank(*)`)
        .eq("store_id", storeId?.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      // .order("id");
      setApproved(app);
    }
    loadExchange();
  }, [storeId]);

  console.log("exchange", exchange);

  async function handleRequest() {
    if (!editBank) {
      alert("กรุณาเลือกธนาคาร");
      return;
    }

    if (!editName.trim()) {
      alert("กรุณากรอกชื่อบัญชี");
      return;
    }

    if (!editNumber) {
      alert("กรุณากรอกเลขที่บัญชี");
      return;
    }
    if (!editAmount) {
      alert("กรุณากรอกจำนวนเงิน");
      return;
    }
    if (Number(editAmount) < 100) {
      alert("ขั้นต่ำ 100 บาท");
      return;
    }
    if (Number(editAmount) > wallet.balance) {
      alert("ยอดไม่พอ");
      return;
    }
    // if (Number(editAmount) > wallet.balance) {
    //   alert("เงินที่ไม่พอ");
    //   return;
    // }
    const { data: newReq, error: newReqError } = await supabase
      .from("exchange_request")
      .insert({
        store_id: storeId?.id,
        status: "pending",
        bank_id: Number(editBank),
        name: editName,
        amount: Number(editAmount),
        bank_number: Number(editNumber),
      })
      .select(
        `
    *,
    bank (*)
  `,
      )
      .single();
    // console.log("INSERT", newReq);
    if (newReqError) {
      alert(newReqError.message);
      return;
    }
    if (!newReqError) {
      setExchange((prev) => [newReq, ...prev]);
      alert("สร้างคำขอสำเร็จ");
      setEditBank("");
      setEditName("");
      setEditAmount("");
      setEditNumber("");
    }
  }
  console.log("exSel", exSel);
  // console.log("editNumber", editNumber);
  // console.log(typeof Number(editNumber));
  if (!user) return <div>กำลังโหลด...</div>;

  if (user?.role !== "store_owner") {
    return <div>ไม่มีสิทธิ์</div>;
  }
  if (!mounted) return null;
  return (
    <div>
      <div className={styles.top}>
        <h2>💸 รายได้ & ถอนเงิน</h2>
        <span>สร้างคำขอถอนเงินเข้าบัญชีธนาคาร</span>
      </div>

      <div className={styles.my_wallet}>
        <div className={styles.my_wallet_detail}>
          <div className={styles.my_wallet_detail_left}>
            <span className={styles.storename}>{storeId?.name}</span>
            <div>
              <b className={styles.uid} onClick={() => setUid((prev) => !prev)}>
                UID
              </b>
              {uid && <span>{storeId?.user_id}</span>}
            </div>
          </div>
          <div className={styles.my_wallet_detail_right}>
            <span>ยอดเงินที่ถอนได้ (Available Balance)</span>
            <h3>฿{wallet?.balance}</h3>
            <button
              onClick={() => setModalReq(true)}
              className={styles.btn_withdraw}
            >
              ถอนเงิน
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.income}>
          <h3>⏱️ ประวัติการเงิน</h3>
          <div className={styles.income_content}>
            {walletT &&
              walletT.map((wt) => (
                <div
                  key={wt.id}
                  className={styles.income_card}
                  onClick={() => {
                    setSelectOrder(wt);
                    setModalOrder(true);
                  }}
                >
                  <div className={styles.income_card_left}>
                    <b>Order #{wt.order_id}</b> <span>ประเภท : {wt.type}</span>{" "}
                    <span>
                      {" "}
                      เวลา :
                      <span style={{ opacity: "50%" }}>
                        {" "}
                        {new Date(wt.created_at).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </span>
                  </div>
                  <div>
                    <b className="price">+ ฿{wt.amount}</b>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className={styles.history}>
          <h3>⏱️ คำขอแลกเงิน</h3>
          <div className={styles.history_select}>
            <button
              onClick={() => setExSel(0)}
              className={exSel === 0 ? styles.active : ""}
            >
              กำลังดำเเนินการ
            </button>
            <button
              onClick={() => setExSel(1)}
              className={exSel === 1 ? styles.active : ""}
            >
              คำขอเสร็จสิ้น
            </button>
          </div>
          <div className={styles.history_content}>
            {exSel === 0 &&
              exchange?.map((ex) => (
                <div key={ex.id} className={styles.history_card}>
                  <div>
                    <b>ถอนเข้า {ex.bank.name}</b>
                    <span style={{ opacity: "50%" }}>
                      {new Date(ex.created_at).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className={styles.history_card_right}>
                    <b>฿{ex.amount}</b>
                    <span className={`${styles.status} ${ex.status}bg`}>
                      {ex.status}
                    </span>
                  </div>
                </div>
              ))}
            {exSel === 1 &&
              approved?.map((app) => (
                <div
                  key={app.id}
                  className={styles.history_card}
                  onClick={() => {
                    setSelectedApp(app);
                    setShowModal(true);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <b>ถอนเข้า {app.bank.name}</b>
                    <span style={{ opacity: "50%" }}>
                      {new Date(app.created_at).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className={styles.history_card_right}>
                    <b>฿{app.amount}</b>
                    <span className={`${styles.status} ${app.status}bg`}>
                      {app.status}
                    </span>
                  </div>{" "}
                </div>
              ))}
            {showModal && (
              <ModalSlip setShowModal={setShowModal} app={selectedApp} />
            )}
            {modalReq && (
              <ModalReq
                setModalReq={setModalReq}
                editBank={editBank}
                setEditBank={setEditBank}
                bank={bank}
                editName={editName}
                setEditName={setEditName}
                editNumber={editNumber}
                setEditNumber={setEditNumber}
                editAmount={editAmount}
                setEditAmount={setEditAmount}
                handleRequest={handleRequest}
              />
            )}
            {modalOrder && (
              <ModalOrder
                setModalOrder={setModalOrder}
                selectOrder={selectOrder}
                setSelectOrder={setSelectOrder}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
