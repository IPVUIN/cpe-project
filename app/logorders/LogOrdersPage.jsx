"use client";

import styles from "@/app/logOrders/logOrders.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

import Image from "next/image";
//import { startTransition } from "react";

export default function LogOrdersPage() {
  const [user, setUser] = useState(null);
  const [dataStore, setDataStore] = useState(null);
  const [mounted, setMounted] = useState(false);
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

      const { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", auth.user.id)
        .single();

      setDataStore(store);
    }
    loadUser();
  }, []);

  if (!mounted) return <div className="nologin">กำลังโหลดข้อมูลร้าน...</div>;
  return (
    <>
      <div className={styles.container}>
        <div className={styles.top}>
          {" "}
          <div className={styles.top_name}>
            <h1>{dataStore?.name} </h1>
            <h3>
              {user?.username} - {user?.role}
            </h3>
        
          </div>{" "}
        </div>{" "}
      </div>
      <h3>History</h3>
    </>
  );
}
