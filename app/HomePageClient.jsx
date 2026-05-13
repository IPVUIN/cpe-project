"use client";

import Link from "next/link";
import styles from "@/app/page.module.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Page({ stores, category }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [balance, setBalance] = useState(0);
  const [cate, setCate] = useState(null);
  const [mounted, setMounted] = useState(false);

  const filteredStores = stores.filter((store) => {
    const matchSearch = store.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchCategory = cate ? store.store_category === cate : true;

    return matchSearch && matchCategory;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // โหลด user จาก session
  useEffect(() => {
    async function loadUser() {
      //  if (!user) return;
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        setUser(null);
        return;
      }

      setUser(auth.user);

      // ⭐ โหลดข้อมูลจากตาราง users
      const { data: userData, error } = await supabase
        .from("users")
        .select("username, role")
        .eq("id", auth.user.id)
        .single();

      if (userData) {
        setUsername(userData.username);
        setRole(userData.role);
      }
    }

    loadUser();
  }, []);
  useEffect(() => {
    if (!user) return;
    async function loadWallet() {
      const { data: wallet } = await supabase
        .from("wallet")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) {
        setBalance(wallet.balance);
      }
    }
    loadWallet();
  }, [user]);

  function storeCat(catId) {
    setCate(catId);
  }
  // if (user === null) {
  //   return <div className={"nologin"}>โปรดเข้าสู่ระบบ...</div>;
  // }

  const sortedStores = [...filteredStores].sort((a, b) => a.id - b.id);


  console.log("USER", user);
  if (!mounted) return null;
  return (
    <>
      <div>
        <div className={styles.top}>
          {user ? (
            <div className={styles.top_header}>
              <div className={styles.top_user}>
                <div className={styles.top_user_left}>
                  <div>
                    <h1>Hello, {username}</h1>
                    <span className={styles.top_under_user}>สั่งอะไรดี...</span>
                  </div>
                </div>
              </div>

              <div className={styles.top_wallet}>
                <Link href="/wallet" className={styles.wallet_circle}>
                  ฿{balance}
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.top_header}>
              <div className={styles.top_user}>
                <h1>❗️ เข้าสู่ระบบเพื่อสั่งอาหาร</h1>
              </div>
            </div>
          )}
          {/* <p>
            ล็อกอินอยู่ด้วยอีเมล: {user.email} - {username} - {role}
          </p> */}

          <div className={styles.search}>
            <input
              suppressHydrationWarning
              type="text"
              placeholder="ค้นหาร้านค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.category}>
            <button
              onClick={() => setCate(null)}
              className={cate === null ? styles.active : ""}
            >
              ทั้งหมด
            </button>
            {category.map((cat) => (
              <button
                key={cat.id}
                onClick={() => storeCat(cat.id)}
                className={cate === cat.id ? styles.active : ""}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        <h2>Stores</h2>
        <div className={styles.listshop}>
          {sortedStores.length > 0 ? (
            sortedStores.map((item) => (
              <div key={item.id} className={styles.shopdiv}>
                <Link
                  href={"/store/" + item.id}
                  className={`${styles.shoplink}`}
                >
                  <div className={styles.divimage}>
                    <Image
                      src={item.image_url || "/iconmain.png"}
                      fill
                      alt="shopicon"
                      className={styles.imagestore}
                    />
                  </div>

                  <div className={styles.textcard}>
                    {item.name}
                    <p>{item.description}</p>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p></p>
          )}
        </div>
      </div>
    </>
  );
}
