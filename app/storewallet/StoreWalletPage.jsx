"use client";

import styles from "@/app/storewallet/storeWalletPage.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import timeAgo from "@/lib/time_ago";
import ModalSlip from "./ModalSlip";
import Image from "next/image";
//import { startTransition } from "react";

export default function StoreWalletPage() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [bank, setBank] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [editBank, setEditBank] = useState("");
  const [editName, setEditName] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editAmount, seteditAmount] = useState("");

  const [exchange, setExchange] = useState(null);
  const [approved, setApproved] = useState(null);
  const [exSel, setExSel] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
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

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", auth.user.id)
        .single();

      setStoreId(store);
    }
    loadUser();
  }, []);

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
      seteditAmount("");
      setEditNumber("");
    }
  }
  console.log("exSel", exSel);
  // console.log("editNumber", editNumber);
  // console.log(typeof Number(editNumber));
  if (!user) return <div>กำลังโหลด...</div>;

  if (user.role !== "store_owner") {
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
          <span>ยอดเงินที่ถอนได้ (Available Balance)</span>
          <h3>฿{wallet?.balance}</h3>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.request}>
          <h3>📩 สร้างคำขอถอนเงิน</h3>
          <div className={styles.request_bank}>
            <span>ธนาคารปลายทาง</span>
            <select
              value={editBank}
              onChange={(e) => setEditBank(e.target.value)}
            >
              <option value="">-- เลือกธนาคาร --</option>
              {bank?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.request_bank_detail}>
            <div>
              <span>ชื่อบัญชี</span>
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>{" "}
            <div>
              <span>เลขที่บัญชี</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="กรอกเป็นตัวเลข"
                value={editNumber}
                onChange={(e) =>
                  setEditNumber(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
          </div>
          <div className={styles.request_amount}>
            <span>จำนวนเงิน</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="ระบุจำนวนเงิน"
              min="100"
              value={editAmount}
              onChange={(e) => seteditAmount(e.target.value)}
            />
          </div>
          <div className={styles.request_amount_under}>
            <span>ขั้นต่ำ 100 บาท</span>
          </div>
          <button onClick={handleRequest} className={styles.btn_req}>
            ยืนยันคำขอ
          </button>
        </div>
        <div className={styles.history}>
          <h3>⏱️ ประวัติการเงิน</h3>
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
            {showModal && <ModalSlip setShowModal={setShowModal} app={selectedApp}/>}
          </div>
        </div>
      </div>
    </div>
  );
}
