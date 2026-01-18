import { supabase } from "@/lib/supabaseClient";

export async function getStores() {
  const { data, error } = await supabase.from("stores").select("*");

  if (error) console.error(error);

  return data;
}

export async function getStoreById(id) {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching store:", error);
    return null;
  }else{
    console.log("getStoreById : ", data);
  }

  return data;
}



export async function getMenusByStores(storeid) {
  const { data, error } = await supabase
    .from("menus")
    .select("*")
    .eq("store_id", storeid);

  if (error) {
    console.error("getMenusByStores Error:", error);
    return [];
  }else{
    console.log("getMenus : ", data);
  }

  return data;
}
