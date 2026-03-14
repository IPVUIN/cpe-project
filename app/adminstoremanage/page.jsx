export const metadata = {
  title: "Store Manage",
};
import AdminStoreManage from "./adminstoremannage";
import { getStores, getCategory } from "@/lib/database";

export default async function Page() {
    const storeCategory = await getCategory();
    const stores = await getStores();
    return <AdminStoreManage stores={stores} category={storeCategory} />;
}