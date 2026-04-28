"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPinTypeAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const icons = String(formData.get("icons") ?? "").trim();

  if (!name) {
    console.error("Tên marker type không được để trống.");
    return;
  }

  if (!icons) {
    console.error("Icon không được để trống.");
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("Bạn chưa đăng nhập.");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.admin !== true) {
    console.error("Bạn không có quyền tạo marker type.");
    return;
  }

  const { error: insertError } = await supabase.from("pin_types").insert({
    name,
    icon: icons,
    created_by: user.id,
  });

  if (insertError) {
    console.error(insertError.message);
    return;
  }

  revalidatePath("/admin/pins");
}