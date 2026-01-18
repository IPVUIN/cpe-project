"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/cart/cartPage.module.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
export default function CartPageClient() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const [cart, setCart] = useState([]);
  const cartKey = user ? `cart_${user.id}` : null;
  function increaseQty(id) {
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      );

      localStorage.setItem(cartKey, JSON.stringify(updated));
      return updated;
    });
  }

  function decreaseQty(id) {
    setCart((prev) => {
      const updated = prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0); // ลบถ้า qty = 0

      localStorage.setItem(cartKey, JSON.stringify(updated));
      return updated;
    });
  }

  useEffect(() => {
    if (!user) return;

    const savedCart = localStorage.getItem(`cart_${user.id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [user]);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (user === null) {
    return <div className={"nologin"}>โปรดเข้าสู่ระบบ...</div>;
  }
  async function handleCheckout() {
    // ตอนนี้เครื่องเรามี session ของคนที่ล็อกอินอยู่ไหม?
    const { data } = await supabase.auth.getSession();
    // ดึง token ออกมาใช้
    const accessToken = data.session?.access_token;

    // เรียก API  API Route
    const res = await fetch("/api/checkout", {
      // POST ใช้ “ส่งข้อมูล”
      method: "POST",
      headers: {
        // ข้อมูลที่ส่งไปเป็น JSON
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      // คือข้อมูลหลักที่ส่งไปให้ server
      body: JSON.stringify({ cart }), // ส่ง cart
    });

    // แปลง response ที่ server ส่งกลับมา (ซึ่งเป็น JSON) ให้เป็น object ใช้งานได้
    // เช่น server ส่ง { ok: true, order_id: 123 }
    const result = await res.json();
    console.log("result", result);
    if (result.ok) {
      localStorage.removeItem(`cart_${user.id}`);
      alert("สั่งซื้อสำเร็จ");
      router.push("/order");
    } else {
      alert(result.error || "เกิดข้อผิดพลาดในการสั่งซื้อ");
    }
  }

  return (
    <div className={styles.container}>
      <div>
        <h1>🛒 Your cart</h1>
        <div>
          {cart.length === 0 && (
            <div className={styles.nomenu}>ยังไม่มีสินค้า</div>
          )}
          {cart.map((item) => (
            <div key={item.id} className={styles.menu_incart}>
              <div className={styles.cardimage}>
                <Image
                  src="/cutlery.png"
                  fill
                  alt="menucart"
                  className={styles.imagemenu}
                />
              </div>
              <div className={styles.menu_text}>
                <div>
                  {" "}
                  <h3>{item.name}</h3> <span>X {item.qty}</span>
                </div>
                <span className={styles.menu_from}>จากร้าน {item.store_name}</span>
                <span className={styles.menu_price}>
                  {" "}
                  {item.price * item.qty} บาท
                </span>
              </div>
              <div className={styles.add}>
                <button onClick={() => decreaseQty(item.id)}>-</button>

                <div>{item.qty}</div>
                <button onClick={() => increaseQty(item.id)}>+</button>
              </div>
            </div>
          ))}
        </div>

        {cart.length != 0 && (
          <div className={styles.totallist}>
            <div className={styles.total}>
              <span>Total</span>
              <span>{totalPrice} บาท</span>
            </div>
            <div className={styles.checkout}>
              <button onClick={handleCheckout}>Checkout</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
