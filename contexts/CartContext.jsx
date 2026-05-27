"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  async function loadCartCount() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCartCount(0);
      return;
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_stores (
          id,
          orders_details (
            id,
            quantity
          )
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "cart");

    if (error) {
      console.log(error);
      return;
    }

    const totalCount = orders.reduce((total, order) => {
      return total + order.order_stores.reduce((storeTotal, store) => {
        return storeTotal + store.orders_details.reduce((itemTotal, item) => {
          return itemTotal + item.quantity;
        }, 0);
      }, 0);
    }, 0);

    setCartCount(totalCount);
  }

  useEffect(() => {
    loadCartCount();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, loadCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}