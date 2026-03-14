import { supabase } from "@/lib/supabaseClient";
import { supabaseServer } from "@/lib/supabaseServer";

export async function getStores() {
  const { data, error } = await supabaseServer.from("stores").select("*");

  if (error) console.error(error);

  return data;
}

export async function getCategory() {
  const { data, error } = await supabaseServer
    .from("store_category")
    .select("*");

  if (error) console.error(error);

  return data;
}

export async function getStoreById(id) {
  const { data, error } = await supabaseServer
    .from("stores")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching store:", error);
    return null;
  } else {
    console.log("getStoreById : ", data);
  }

  return data;
}

export async function getMenusByStores(storeid) {
  const { data, error } = await supabaseServer
    .from("menus")
    .select("*")
    .eq("store_id", storeid).eq("is_active", true);

  if (error) {
    console.error("getMenusByStores Error:", error);
    return [];
  } else {
    console.log("getMenus : ", data);
  }

  return data;
}

export async function LoadCateMenu(storeid) {
  const { data, error } = await supabase
    .from("menu_category")
    .select("*")
    .eq("store_id", storeid);

  if (error) {
    console.error("LoadCateMenu Error:", error);
    return null;
  } else {
    console.log("LoadCateMenu : ", data);
  }
  return data;
}

