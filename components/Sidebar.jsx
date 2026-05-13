"use client";

import styles from "@/components/Sidebar.module.css";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);

  // const { data: listener } = supabase.auth.onAuthStateChange(
  //   async (event, session) => {
  //     if (session?.user) {
  //       setUser(session.user); // ✔ Login → Navbar เปลี่ยนทันที
  //       await loadUser();
  //       //   await loadRole(session.user.id);
  //     } else {
  //       setUser(null);
  //       setUserRole(null); // ✔ Logout → Navbar เปลี่ยนทันที
  //     }
  //   },
  // );
  const pathname = usePathname();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      return;
    }

    async function loadRole() {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(data);
    }

    loadRole();
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    //setUser(null);
    router.push("/login");
  }
  if (pathname === "/reset-password") {
    return null; // ❌ ไม่ render sidebar
  }
  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href={userRole?.role === "store_owner" ? "/HomeStore" : "/"}>
            <Image src="/iconmain.png" width={100} height={100} alt="logo" />
          </Link>
        </div>
        <hr />
        <div className={styles.menu}>
          {!user && (
            <Link href="/">
              <span className={styles.icon}>🍔</span>
              <span className={styles.text}>Home</span>
            </Link>
          )}

          {user && userRole?.role === "store_owner" && (
            <>
              <Link href="/HomeStore">
                <span className={styles.icon}>🍔</span>
                <span className={styles.text}>Home</span>
              </Link>

              <Link href="/storereport">
                <span className={styles.icon}>📊</span>
                <span className={styles.text}>Report</span>
              </Link>

              <Link href="/storesetting">
                <span className={styles.icon}>🏠</span>
                <span className={styles.text}>My store</span>
              </Link>

              <Link href="/storewallet">
                <span className={styles.icon}>💸</span>
                <span className={styles.text}>Wallet & Withdraw</span>
              </Link>
            </>
          )}

          {user && userRole?.role === "customer" && (
            <>
              <Link href="/">
                <span className={styles.icon}>🍔</span>
                <span className={styles.text}>Home</span>
              </Link>
              <Link href="/ordercart">
                <span className={styles.icon}>🛒</span>
                <span className={styles.text}>Cart</span>
              </Link>
              <Link href="/orders">
                <span className={styles.icon}>📃</span>
                <span className={styles.text}>Orders</span>
              </Link>
              <Link href="/wallet">
                <span className={styles.icon}>💸</span>
                <span className={styles.text}>Wallet</span>
              </Link>
            </>
          )}
          {user && userRole?.role === "admin" && (
            <>
              <Link href="/Admin_exchange">
                <span className={styles.icon}>💸</span>
                <span className={styles.text}>Exchang </span>
              </Link>
              <Link href="/exchange_log">
                <span className={styles.icon}>📃</span>
                <span className={styles.text}>Exchang Log</span>
              </Link>
              <Link href="/adminstoremanage">
                <span className={styles.icon}>🏠</span>
                <span className={styles.text}> EditStore</span>
              </Link>
            </>
          )}
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
