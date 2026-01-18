export const metadata = {
  title: "🍔 Canteen Ordering",
};

import HomePageClient from "./HomePageClient";
import { getStores } from "@/lib/database";
export default async function Page() {

  const stores = await getStores();
  return <HomePageClient stores={stores} />;
}
