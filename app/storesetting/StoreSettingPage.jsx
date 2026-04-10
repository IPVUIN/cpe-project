"use client";

import styles from "@/app/storesetting/StoreSettingPage.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import timeAgo from "@/lib/time_ago";

import Image from "next/image";
//import { startTransition } from "react";

export default function StoreSettingPage() {
  const [dataStore, setDataStore] = useState(null);
  const [menus, setMenus] = useState([]);
  const [menuCate, setMenuCate] = useState(null);
  const [catSel, setCatSel] = useState(null);

  const filteredMenus = menus.filter((menu) => {
    const matchCategory = catSel ? menu.menu_category === catSel : true;

    return matchCategory;
  });
  const sortedMenus = [...filteredMenus].sort((a, b) => a.id - b.id);

  const [openModal, setOpenModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();

      const { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", auth.user.id)
        .single();

      setDataStore(store);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!dataStore) return;

    async function loadCategory() {
      const { data: category } = await supabase
        .from("menu_category")
        .select("*")
        .eq("store_id", dataStore.id);

      setMenuCate(category);
    }
    async function loadMenu() {
      const { data: menu } = await supabase
        .from("menus")
        .select("*")
        .eq("store_id", dataStore.id)
        .eq("is_active", true);
      setMenus(menu);
    }
    loadCategory();
    loadMenu();
  }, [dataStore]);

  function cate(catId) {
    setCatSel(catId);
  }
  //   console.log(dataStore);
  // console.log("cat", catSel);
  // console.log(menus);
  return (
    <div>
      {dataStore && (
        <div className={styles.top}>
          <Image
            src={dataStore.image_url || "/miko.jpg"}
            fill
            alt="bgshop"
            className={styles.imagestore}
          />
          <div className={styles.top_name}>
            <div>
              <h2>{dataStore.name}</h2>
              <p>{dataStore.description}</p>
            </div>
            <div>
              <Link href="/storesetting/edit" className="done">
                แก้ไขร้านค้า
              </Link>
            </div>
          </div>
          <Link className={styles.backshop} href="/">
            ⬅
          </Link>
        </div>
      )}

      <div className={styles.category}>
        <button
          onClick={() => setCatSel(null)}
          className={catSel === null ? styles.active : ""}
        >
          ทั้งหมด
        </button>
        {menuCate?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => cate(cat.id)}
            className={catSel === cat.id ? styles.active : ""}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className={styles.listmenu}>
        <h2>เมนู</h2>
        <div className={styles.menu}>
          {sortedMenus?.length > 0 &&
            sortedMenus?.map((menu) => {
              return (
                <div
                  key={menu.id}
                  className={styles.card}
                  // onClick={() => {
                  //   setSelectedMenu(menu);
                  //   setOpenModal(true);
                  // }}
                >
                  <div className={styles.cardimage}>
                    <Image
                      src={ menu.image_url||"/cutlery.png"}
                      fill
                      alt={menu.name}
                      className={styles.imagemenu}
                    />
                  </div>

                  <div className={styles.carddetail}>
                    <div>
                      <h4>{menu.name}</h4>

                      <span>{menu.description}</span>
                    </div>
                    <div className={styles.carddetail_price}>
                      <span>{menu.price} บาท</span>
                    </div>
                  </div>

                  <div className={styles.addmenu}>
                    {/* <button className={styles.minus}>-</button> */}
                    {/* {user ? (
                        <button
                          className={styles.add}
                          onClick={() => addToOrder(menu.id, menu.price)}
                        >
                          +
                        </button>
                      ) : (
                        <></>
                      )} */}
                  </div>
                </div>
              );
            })}
        </div>
        {menus?.length === 0 && (
          <div className={styles.nomenu}>ยังไม่มีเมนูในร้านนี้</div>
        )}
      </div>

      {openModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>{selectedMenu?.name}</h3>
            <p>{selectedMenu?.description}</p>

            <textarea
              placeholder="หมายเหตุ เช่น ไม่ใส่ผัก"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className={styles.modalActions}>
              <button onClick={() => setOpenModal(false)}>ยกเลิก</button>
              <button
              // onClick={() => {
              //   addToCart(selectedMenu);
              //   setOpenModal(false);
              // }}
              >
                เพิ่มลงตะกร้า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
