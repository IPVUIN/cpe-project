"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Image from "next/image";
import styles from "./AddOrderModal.module.css";

export default function AddOrderModal({
  setOpenModal,
  setMenuCate,
  menuCate,
  menuc,
  cate,
  sortedMenus,
  setSelectedMenu,
  modalStep,
  setModalStep,
  countList,
  OrderTotal,
  countAdd,
  setCountAdd,
  count,
  note,
  setNote,
  selectedMenu,
  addToOrder,
  myCart,
  Delmenu,
  UpdateOrder,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Modal>
      <div className={styles.Modal}>
        {modalStep === "list" && (
          <>
            <div className={styles.modaltop}>
              <h2>เพิ่มออเดอร์หน้าร้าน</h2>{" "}
              <button
                onClick={() => setOpenModal(false)}
                className={styles.btnclose}
              >
                X
              </button>
            </div>

            <div className={styles.modalmenucat}>
              <button
                onClick={() => setMenuCate(null)}
                className={menuCate === null ? styles.active : ""}
              >
                ทั้งหมด
              </button>
              {menuc &&
                menuc.map((mc) => (
                  <button
                    key={mc.id}
                    onClick={() => cate(mc.id)}
                    className={menuCate === mc.id ? styles.active : ""}
                  >
                    {mc.name}
                  </button>
                ))}
            </div>
            <div className={styles.modalmenulist}>
              {sortedMenus?.map((m) => (
                <div
                  key={m.id}
                  className={styles.modalmenucard}
                  onClick={() => {
                    setSelectedMenu(m);
                    setModalStep("detail");
                  }}
                >
                  <div className={styles.cardimage}>
                    <Image
                      src={m.image_url|| "/cutlery.png"}
                      fill
                      alt={m.name}
                      className={styles.imagemenu}
                    />
                  </div>

                  <div>
                    {" "}
                    <h4>{m.name}</h4>
                    <span> {m.price} บาท</span>
                  </div>
                </div>
              ))}
            </div>

            {/* <textarea
                placeholder="หมายเหตุ เช่น ไม่ใส่ผัก"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              /> */}

            <div className={styles.modalActions}>
              <div
                className={styles.totalOrder}
                onClick={() => setModalStep("myList")}
              >
                <div>ราคารวม ({countList} รายการ) </div>
                <span>{OrderTotal} บาท</span>
              </div>
            </div>
          </>
        )}
        {modalStep === "detail" && (
          <>
            <div className={styles.modalDetail}>
              <button
                onClick={() => {
                  setModalStep("list");
                  setCountAdd(0);
                  setNote("");
                }}
                className={styles.btncancel}
              >
                ⬅ กลับ
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
          </>
        )}
        {modalStep === "myList" && (
          <>
            <div className={styles.modalDetaillisted}>
              <div>
                <button
                  onClick={() => setModalStep("list")}
                  className={styles.btncancel}
                >
                  ⬅ กลับ
                </button>
              </div>

              <h4>รายการที่เลือกไว้</h4>

              {myCart?.orders_details.map((mc) => (
                <div key={mc.id} className={styles.modelmenucardlisted}>
                  {" "}
                  <div className={styles.cardimage}>
                    <Image
                      src={mc.menus?.image_url|| "/cutlery.png"}
                      fill
                      alt={mc.id}
                      className={styles.imagemenu}
                    />
                  </div>
                  <div className={styles.modalcardlisted}>
                    <div>
                      <h4>
                        {mc.menus?.name}{" "}
                        <span style={{ color: "blue" }}>x{mc.quantity}</span>
                      </h4>
                      {mc.note ? (
                        <>
                          <span style={{ color: "#f1a500" }}>📝 {mc.note}</span>{" "}
                          <br />
                        </>
                      ) : (
                        ""
                      )}

                      <span>{mc.subtotal} บาท</span>
                    </div>
                    <button
                      className={styles.deletedlist}
                      onClick={() => Delmenu(mc.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}

              <div className={styles.modalCheckout}>
                <div className={styles.totalOrderlisted}>
                  <div>ราคารวม ({countList} รายการ) </div>
                  <span>{OrderTotal} บาท</span>
                </div>
                <button
                  className={styles.btnadd}
                  onClick={() => {
                    console.log("myCart:", myCart.id);
                    UpdateOrder(myCart.id, "cooking", myCart);
                  }}
                  disabled={!myCart}
                >
                  ยืนยัน
                </button>
              </div>
            </div>{" "}
          </>
        )}
      </div>
    </Modal>
  );
}
