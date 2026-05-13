export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "🍔 Canteen Ordering",
};

import HomePageClient from "./HomePageClient";
import { getStores, getCategory } from "@/lib/database";

export default async function Page() {
  const storeCategory = await getCategory();
  const stores = await getStores();

  return <HomePageClient stores={stores} category={storeCategory} />;
}