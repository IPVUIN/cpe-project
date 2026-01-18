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

    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) setUser(auth.user);
    }
    loadUser();
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user); // ✔ Login → Navbar เปลี่ยนทันที
        } else {
          setUser(null); // ✔ Logout → Navbar เปลี่ยนทันที
        }
      }
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
          <Link href="/">🍔 Home</Link>
          <Link href="/cart">🛒 Cart</Link>
          <Link href="/order">📃 Order</Link>
          <Link href="/wallet">💸 Wallet</Link>
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
