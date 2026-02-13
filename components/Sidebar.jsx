"use client";

import styles from "@/components/Sidebar.module.css";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    //async function loadUser() {
    //   const { data: auth } = await supabase.auth.getUser();
    //   if (!auth.user) {
    //     setUser(null);
    //     return;
    //   }
    //   setUser(auth.user);
    // }
    // loadUser();

    // async function loadRole(uid) {
    //   const { data, error } = await supabase
    //     .from("users")
    //     .select("role")
    //     .eq("id", uid)
    //     .single();

    //   if (error) {
    //     console.error("load role error", error);
    //     setUserRole(null);
    //     return;
    //   }

    //   setUserRole(data); // หรือ data.role (แนะนำด้านล่าง)
    // }

    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        setUser(null);
        setUserRole(null);
        return;
      }

      setUser(auth.user);

      const { data: roleData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      setUserRole(roleData);
    }
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user); // ✔ Login → Navbar เปลี่ยนทันที

          //   await loadRole(session.user.id);
        } else {
          setUser(null);
          setUserRole(null); // ✔ Logout → Navbar เปลี่ยนทันที
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    //setUser(null);
    router.push("/login");
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">
            <Image src="/iconmain.png" width={100} height={100} alt="logo" />
          </Link>
        </div>
        <hr />
        <div className={styles.menu}>
          {" "}
          {userRole?.role === "store_owner" ? (
            <>
              {" "}
              <Link href="/myStore">🍔 Home</Link>
              {/* <Link href="/cart">🛒 Cart</Link> */}
              <Link href="/myStoreSetting">📃 My store</Link>
              <Link href="/wallet">💸 Wallet</Link>
            </>
          ) : (
            <>
              {" "}
              <Link href="/">🍔 Home</Link>
              {/* <Link href="/cart">🛒 Cart</Link> */}
              <Link href="/ordercart">📃 Cart</Link>
              <Link href="/orders">📃 Orders</Link>
              <Link href="/wallet">💸 Wallet</Link>
            </>
          )}
          {/* {!userRole && <div>โปรดเข้าสู่ระบบ</div>} */}
        </div>
        <div className={styles.logout_login}>
          {user ? (
            <>
              <div className={styles.logout_user}>
                <span>{user.email}</span>
                <hr />
                <button onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.login}>
                <Link href="/login" className={styles.login_link}>
                  Log in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
