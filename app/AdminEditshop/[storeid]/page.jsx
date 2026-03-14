export const metadata = {
  title: "🛒 Canteen Ordering",
};

import AdminEditshop from "./AdminEditshop";
import { getStoreById, getMenusByStores, LoadCateMenu } from "@/lib/database";

export default async function Page({ params }) {
  const { storeid } = await params;
  console.log("id:", storeid);
  // ดึงข้อมูลที่ server
  const store = await getStoreById(storeid);
  const menus = await getMenusByStores(storeid);
  const menusCate = await LoadCateMenu(storeid);

  return <AdminEditshop store={store} menus={menus} menusCate={menusCate}/>;
}
