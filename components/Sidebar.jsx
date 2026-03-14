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
          {!user && <Link href="/">🍔 Home</Link>}

          {user && userRole?.role === "store_owner" && (
            <>
              <Link href="/HomeStore">🍔 Home</Link>
              <Link href="/storereport">📊 Report</Link>
              <Link href="/storesetting">🏠 My store</Link>
              <Link href="/storewallet">💸 Wallet & Withdraw</Link>
            </>
          )}

          {user && userRole?.role === "customer" && (
            <>
              <Link href="/">🍔 Home</Link>
              <Link href="/ordercart">🛒 Cart</Link>
              <Link href="/orders">📃 Orders</Link>
              <Link href="/wallet">💸 Wallet</Link>
            </>
          )}
          {user && userRole?.role === "admin" && (
            <>
              <Link href="/adminstoremanage">EditStore</Link>
              <Link href="/Admin_exchange">Exchang</Link>
              <Link href="/exchange_log">Exchang Log</Link>
              <Link href="/Admin_ManageUsers">Users Manage</Link>
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
