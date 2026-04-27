"use server";

import { createClient } from "@/lib/supabase/server";

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
    const storagePath = `${user.id}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(storagePath, file, {
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: fileRecord, error: fileInsertError } = await supabase
      .from("files")
      .insert({
        name: file.name,
        uploaded_by: user.id,
        mime_type: file.type,
        bucket_name: "avatars",
        path: `/${user.id}/`,
      })
      .select("id")
      .single();

    if (fileInsertError) {
      await supabase.storage.from("avatars").remove([storagePath]);
      throw fileInsertError;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar: fileRecord.id })
      .eq("id", user.id);

    if (profileError) {
      throw profileError;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi lưu avatar:", error);
    return { success: false, error: error.message || "Đã xảy ra lỗi hệ thống khi lưu ảnh." };
  }
}
