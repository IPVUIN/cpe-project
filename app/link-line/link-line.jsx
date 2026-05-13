"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function LinkLinePage() {
  const searchParams = useSearchParams();
  const lineId = searchParams.get("lineId");

  console.log("LINEID", lineId);
  useEffect(() => {
    async function link() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // ถ้ายังไม่ login → พาไป login (ปรับ path ตามของคุณ)
      // ❗ ถ้ายังไม่ login → เก็บ lineId ไว้ก่อน
      if (!user) {
        if (lineId) {
          localStorage.setItem("lineId", lineId);
        }

        window.location.href = "/login";
        return;
      }


      if (lineId) {
        await supabase
          .from("users")
          .update({ line_id: lineId })
          .eq("id", user.id);


        alert("เชื่อม LINE สำเร็จ ✅");
      }
    }

    link();
  }, [lineId, supabase]);

  return <div>กำลังเชื่อม LINE...</div>;
}
