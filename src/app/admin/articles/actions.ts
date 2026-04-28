"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type CategoryActionResult = {
  success: boolean;
  error?: string;
  category?: {
    id: number;
    name: string;
    created_at: string;
  };
};

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "Bạn chưa đăng nhập." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.admin !== true) {
    return { supabase, user: null, error: "Bạn không có quyền quản lý danh mục bài viết." };
  }

  return { supabase, user, error: null };
}

export async function createArticleCategoryAction(formData: FormData): Promise<CategoryActionResult> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { success: false, error: "Tên danh mục không được để trống." };
  }

  const { supabase, user, error } = await requireAdminUser();
  if (error || !user) {
    return { success: false, error: error ?? "Không thể xác thực người dùng." };
  }

  const { data: insertedCategory, error: insertError } = await supabase
    .from("article_categories")
    .insert({
      name,
      created_by: user.id,
    })
    .select("id, name, created_at")
    .maybeSingle();

  if (insertError || !insertedCategory) {
    return { success: false, error: insertError?.message ?? "Không thể tạo danh mục." };
  }

  revalidatePath("/admin/articles");
  return { success: true, category: insertedCategory };
}

export async function updateArticleCategoryAction(formData: FormData): Promise<CategoryActionResult> {
  const idValue = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();

  if (!Number.isInteger(idValue) || idValue <= 0) {
    return { success: false, error: "ID danh mục không hợp lệ." };
  }

  if (!name) {
    return { success: false, error: "Tên danh mục không được để trống." };
  }

  const { supabase, user, error } = await requireAdminUser();
  if (error || !user) {
    return { success: false, error: error ?? "Không thể xác thực người dùng." };
  }

  const { data: updatedCategory, error: updateError } = await supabase
    .from("article_categories")
    .update({ name })
    .eq("id", idValue)
    .select("id, name, created_at")
    .maybeSingle();

  if (updateError || !updatedCategory) {
    return { success: false, error: updateError?.message ?? "Không thể cập nhật danh mục." };
  }

  revalidatePath("/admin/articles");
  return { success: true, category: updatedCategory };
}

export async function deleteArticleCategoryAction(formData: FormData): Promise<CategoryActionResult> {
  const idValue = Number(formData.get("id"));

  if (!Number.isInteger(idValue) || idValue <= 0) {
    return { success: false, error: "ID danh mục không hợp lệ." };
  }

  const { supabase, user, error } = await requireAdminUser();
  if (error || !user) {
    return { success: false, error: error ?? "Không thể xác thực người dùng." };
  }

  const { error: deleteError, count } = await supabase
    .from("article_categories")
    .delete({ count: "exact" })
    .eq("id", idValue);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  if ((count ?? 0) === 0) {
    return { success: false, error: "Không tìm thấy danh mục để xóa." };
  }

  revalidatePath("/admin/articles");
  return { success: true };
}
