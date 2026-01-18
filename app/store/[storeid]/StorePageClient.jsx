"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/store/[storeid]/storePage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function StorePageClient({ store, menus }) {
  // ระหว่างโหลด
  if (!store) return <div className="nologin">กำลังโหลดข้อมูลร้าน...</div>;

  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const [cart, setCart] = useState([]);
  useEffect(() => {
    if (!user) return;

    const savedCart = localStorage.getItem(`cart_${user.id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [user]);

  function addToCart(menu) {
    if (!user) return;

    setCart((prev) => {
      const found = prev.find((item) => item.id === menu.id);

      const updatedCart = found
        ? prev.map((item) =>
            item.id === menu.id ? { ...item, qty: item.qty + 1 } : item
          )
        : [...prev, { ...menu, store_name: store.name, qty: 1 }];

      localStorage.setItem(`cart_${user.id}`, JSON.stringify(updatedCart));
      return updatedCart;
    });
  }
  function decreaseQty(menu) {
    if (!user) return;

    setCart((prev) => {
      const updatedCart = prev
        .map((item) =>
          item.id === menu.id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0); // ถ้า qty = 0 ลบทิ้ง

      localStorage.setItem(`cart_${user.id}`, JSON.stringify(updatedCart));
      return updatedCart;
    });
  }

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Image
          src={store.image_url}
          fill
          alt="bgshop"
          className={styles.imagestore}
        />
        <div className={styles.top_name}>
          <h2>{store.name}</h2>
          <p>{store.description}</p>
        </div>
        <Link className={styles.backshop} href="/">
          ⬅
        </Link>
      </div>
      <div className={styles.listmenu}>
        <h2>Menu</h2>
        <div className={styles.menu}>
          {menus.length > 0 &&
            menus.map((menu) => {
              const cartItem = cart.find((c) => c.id === menu.id);
              const qty = cartItem?.qty ?? 0;
              return (
                <div key={menu.id}>
                  <div className={styles.card}>
                    <div className={styles.cardimage}>
                      <Image
                        src="/cutlery.png"
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

                    {qty > 0 && <div className={styles.qtymenu}>{qty}</div>}
                    {user ? (
                      <div className={styles.addminusdiv}>
                        {qty > 0 && (
                          <button
                            className={styles.minus}
                            onClick={() => decreaseQty(menu)}
                          >
                            −
                          </button>
                        )}

                        <button
                          className={styles.addcart}
                          onClick={() => addToCart(menu)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              );
            })}
        </div>
        {menus.length === 0 && (
          <div className={styles.nomenu}>ยังไม่มีเมนูในร้านนี้</div>
        )}
      </div>

      <div className={styles.bottom}>
        <Link href="/" className={styles.back}>
          ⬅ กลับ
        </Link>
        <Link href="/cart" className={styles.cart}>
          🛒 My cart{" "}
          {totalQty > 0 && <span className={styles.badge}>{totalQty}</span>}
        </Link>
      </div>
    </div>
  );
}
