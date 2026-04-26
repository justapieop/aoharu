"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadAvatarAction(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "Không tìm thấy tệp." };
  }

  // Enforce 5MB limit strictly (5 * 1024 * 1024 bytes)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { success: false, error: "Tệp tải lên không được vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  try {
    // Generate Buffer from the raw file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert Buffer to postgres standard HEX bytea mapping (`\xDEADBEEF...`)
    const hexString = '\\x' + buffer.toString('hex');

    // Execute standard UPDATE on the `profiles` table to respect RLS UPDATE policy
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        avatar: hexString
      })
      .eq("id", user.id);

    if (dbError) {
      throw dbError;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi lưu avatar:", error);
    return { success: false, error: error.message || "Đã xảy ra lỗi hệ thống khi lưu ảnh." };
  }
}
