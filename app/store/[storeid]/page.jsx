export const metadata = {
  title: "🛒 Canteen Ordering",
};

import StorePageClient from "./StorePageClient";
import { getStoreById, getMenusByStores } from "@/lib/database";

export default async function Page({ params }) {
  const { storeid } = await params;
  console.log("id:", storeid);
  // ดึงข้อมูลที่ server
  const store = await getStoreById(storeid);
  const menus = await getMenusByStores(storeid);

  return <StorePageClient store={store} menus={menus} />;
}
