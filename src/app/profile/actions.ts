"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(displayName: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.updateUser({
    data: { display_name: displayName, },
  });

  if (error || !data) {
    return { success: false, error: "Lỗi cập nhật tên", };
  }

  return { success: true, };
}

export async function uploadAvatarAction(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "Không tìm thấy tệp." };
  }

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
    const filePath = `${user.id}/avatar`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError || !uploadData) {
      throw uploadError || new Error("Upload thất bại.");
    }

    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        avatar: uploadData.id,
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
