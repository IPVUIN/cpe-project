"use client";

import styles from "@/app/storesetting/edit/StoreEditPage.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import timeAgo from "@/lib/time_ago";
import Image from "next/image";
import EditModal from "./EditModal.page";
import AddModal from "./AddModal";
import AddCate from "./AddCate";
//import { startTransition } from "react";

export default function StoreEditPage() {
  const [user, setUser] = useState(null);
  const [dataStore, setDataStore] = useState(null);
  const [menus, setMenus] = useState(null);
  const [menuCate, setMenuCate] = useState(null);

  const [storeName, setStoreName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalCate, setShowModalCate] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);

  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editImage, setEditImage] = useState("");

  const [addName, setAddName] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addCategory, setAddCategory] = useState("");
  // const [addImage, setAddImage] = useState("");
  const [addNameCate, setAddNameCate] = useState("");
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

  useEffect(() => {
    if (!dataStore) return;

    async function loadCategory() {
      const { data: category } = await supabase
        .from("menu_category")
        .select("*,menus(*)")
        .eq("store_id", dataStore.id);

      setMenuCate(category);
    }
    async function loadMenu() {
      const { data: menu } = await supabase
        .from("menus")
        .select("*")
        .eq("store_id", dataStore.id)
        .order("is_active", { ascending: false })
        .order("id", { ascending: true });
      //  .eq("is_active", true);
      setMenus(menu);
    }
    loadCategory();
    loadMenu();
  }, [dataStore]);

  useEffect(() => {
    if (!dataStore) return;

    setStoreName(dataStore.name);
    setStoreDesc(dataStore.description);
  }, [dataStore]);
  console.log("menuCate", menuCate);

  useEffect(() => {
    if (!selectedMenu) return;

    setEditName(selectedMenu.name);
    setEditPrice(selectedMenu.price);
    setEditCategory(String(selectedMenu.menu_category));
    setEditImage(selectedMenu.image_url || "/iconmain.png");
  }, [selectedMenu]);

  console.log(selectedMenu);
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showModal]);
  async function handleSave() {
    let publicUrl = dataStore?.image_url;
    console.log("publicUrl1", publicUrl);
    if (selectedFile) {
      console.log("selectedFile", selectedFile);
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `store-${dataStore.id}.${fileExt}`;
      console.log("fileEXT", fileExt);
      console.log("fileName", fileName);

      const { error: uploadError } = await supabase.storage
        .from("store-images")
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) {
        console.error(uploadError);
        return;
      }

      const { data } = supabase.storage
        .from("store-images")
        .getPublicUrl(fileName);

      publicUrl = data.publicUrl + `?t=${Date.now()}`;
      console.log("publicUrl2", publicUrl);
    }

    const { error } = await supabase
      .from("stores")
      .update({
        description: storeDesc,
        image_url: publicUrl,
      })
      .eq("id", dataStore?.id);

    if (error) {
      alert("เกิดข้อผิดพลาด");
    } else {
      alert("บันทึกสำเร็จ ✅");
    }
  }
  function handleEdit(menu) {
    setSelectedMenu(menu);
    setShowModal(true);
  }
  function handleAdd() {
    setShowModalAdd(true);
  }
  function handleCate() {
    setShowModalCate(true);
  }
  console.log(selectedMenu);

  async function handleAddMenu() {
    const { data: menuData, error: insertError } = await supabase
      .from("menus")
      .insert({
        name: addName,
        price: addPrice,
        menu_category: editCategory ? Number(editCategory) : null,
        store_id: dataStore?.id,
      })
      .select()
      .single();

    if (insertError) {
      alert(insertError.message);
      return;
    }

    let publicUrl = null;

    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `menu-${menuData.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(fileName);

      publicUrl = data.publicUrl + `?t=${Date.now()}`;

      await supabase
        .from("menus")
        .update({ image_url: publicUrl })
        .eq("id", menuData.id);
    }

    alert("เพิ่มเมนูสำเร็จ");

    setShowModalAdd(false);
    setAddName("");
    setAddPrice("");
    setAddCategory("");

    loadMenu();
  }
  async function handleAddCate() {
    if (!addNameCate) {
      alert("กรุณากรอกชื่อหมวดหมู่");
      return;
    }
    const { data, error: cateErr } = await supabase
      .from("menu_category")
      .insert({
        name: addNameCate,
        store_id: dataStore?.id,
      })
      .select()
      .single();

    if (cateErr) {
      alert(cateErr.message);
      return;
    } else {
      alert("เพิ่มหมวดหมู่สำเร็จ");
      setAddNameCate("");
      setMenuCate((prev) => [...prev, data]);
    }
  }
  async function handleUpdate() {
    let publicUrl = selectedMenu?.image_url;
    console.log("publicUrl1", publicUrl);
    console.log("editCAte", editCategory);
    if (selectedFile) {
      console.log("selectedFile", selectedFile);
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `menu-${selectedMenu.id}.${fileExt}`;
      console.log("fileEXT", fileExt);
      console.log("fileName", fileName);

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) {
        console.error(uploadError);
        return;
      }

      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(fileName);

      publicUrl = data.publicUrl + `?t=${Date.now()}`;
      console.log("publicUrl2", publicUrl);
    }

    const { error } = await supabase
      .from("menus")
      .update({
        name: editName,
        price: editPrice,
        menu_category: editCategory ? Number(editCategory) : null,
        image_url: publicUrl,
      })
      .eq("id", selectedMenu?.id);

    if (!error) {
      setShowModal(false);
      alert("อัปเดตสำเร็จ");

      loadMenu();
    }
  }
  async function handleActive(menuId, action) {
    const { error } = await supabase
      .from("menus")
      .update({ is_active: action })
      .eq("id", menuId);

    if (error) {
      alert(error.message);
      return;
    }
    if (!error) {
      if (action === false) {
        alert("ปิดเมนูสำเร็จ");
      } else {
        alert("เปิดเมนูสำเร็จแล้ว");
      }
      setShowModal(false);
      loadMenu();
    }
  }
  async function loadMenu() {
    const { data } = await supabase
      .from("menus")
      .select("*")
      .eq("store_id", dataStore.id)
      .order("is_active", { ascending: false })
      .order("id", { ascending: true });

    setMenus(data);
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }
  return (
    <div>
      <h2>จัดการเมนู ร้านค้า</h2>
      {dataStore && (
        <div className={styles.top_edit}>
          <span className={styles.top_edit_storename}>
            <b>ข้อมูลร้านค้า</b> <span>{storeName}</span>
          </span>
          <hr />
          <div className={styles.top_edit_detail}>
            <div className={styles.top_edit_name}>
              <span>คำอธิบายร้านค้า</span>
              <textarea
                value={storeDesc}
                onChange={(e) => setStoreDesc(e.target.value)}
              />
            </div>
            <div className={styles.top_edit_image}>
              <div className={styles.divimage}>
                <Image
                  src={previewUrl || dataStore?.image_url || "/iconmain.png"}
                  fill
                  alt="bgshop"
                  className={styles.imagestore}
                />
              </div>{" "}
              <input
                type="file"
                onChange={handleImageUpload}
                className={styles.inputFile}
              />{" "}
            </div>
          </div>
          <div className={styles.bottom_edit}>
            <button onClick={handleSave}>บันทึกข้อมูล</button>
          </div>
        </div>
      )}
      <div className={styles.menu_list_top}>
        <h3>รายการเมนูอาหาร - {menus?.length} เมนู</h3>
        <div>
          <button onClick={handleCate} className={styles.btnaddcat}>
            เพิ่มหมวดหมู่
          </button>
          <button onClick={handleAdd} className={styles.btnaddmenu}>
            เพิ่มเมนูอาหาร
          </button>
        </div>
      </div>
      <div className={styles.menu_list}>
        <table className={styles.menuTable}>
          <thead>
            <tr>
              <th>รูปภาพ</th>
              <th>ชื่อเมนู</th>
              <th>หมวดหมู่</th>
              <th>ราคา (฿)</th>
              <th>จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {menus?.map((menu) => {
              const category = menuCate?.find(
                (c) => c.id === menu.menu_category,
              );

              return (
                <tr
                  key={menu.id}
                  className={menu.is_active === false ? styles.offMenu : ""}
                >
                  <td>
                    <div className={styles.tableImage}>
                      <Image
                        src={menu.image_url || "/iconmain.png"}
                        fill
                        alt="menu"
                        className={styles.imagestore}
                      />
                    </div>
                  </td>

                  <td>
                    {menu.name}
                    {menu.is_active === false && (
                      <span style={{ color: "red" }}> (ปิดอยู่)</span>
                    )}
                  </td>

                  <td>
                    <span className={styles.badge}>
                      {category ? category.name : "-"}
                    </span>
                  </td>

                  <td className={styles.price}>฿{menu.price}</td>

                  <td>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(menu)}
                    >
                      ✏️
                    </button>
                    {menu.is_active === true ? (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleActive(menu.id, false)}
                      >
                        🗑
                      </button>
                    ) : (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleActive(menu.id, true)}
                      >
                        ON
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <EditModal
          editName={editName}
          setEditName={setEditName}
          editPrice={editPrice}
          setEditPrice={setEditPrice}
          editCategory={editCategory}
          setEditCategory={setEditCategory}
          menuCate={menuCate}
          editImage={editImage}
          handleUpdate={handleUpdate}
          setShowModal={setShowModal}
          setSelectedFile={setSelectedFile}
        />
      )}

      {showModalAdd && (
        <AddModal
          setShowModalAdd={setShowModalAdd}
          menuCate={menuCate}
          addName={addName}
          setAddName={setAddName}
          addPrice={addPrice}
          setAddPrice={setAddPrice}
          addCategory={addCategory}
          setAddCategory={setAddCategory}
          handleAddMenu={handleAddMenu}
          setSelectedFile={setSelectedFile}
        />
      )}

      {showModalCate && (
        <AddCate
          setShowModalCate={setShowModalCate}
          menuCate={menuCate}
          setMenuCate={setMenuCate}
          addNameCate={addNameCate}
          setAddNameCate={setAddNameCate}
          handleAddCate={handleAddCate}
        />
      )}
    </div>
  );
}
