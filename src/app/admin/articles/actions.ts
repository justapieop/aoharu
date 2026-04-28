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

type ArticleActionResult = {
  success: boolean;
  error?: string;
  article?: {
    id: string;
    title: string;
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

function getFormFile(formData: FormData, fieldName: string): File | null {
  const value = formData.get(fieldName);
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

export async function createArticleAction(formData: FormData): Promise<ArticleActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const categoryIdRaw = formData.get("category_id");
  const categoryId = categoryIdRaw == null || categoryIdRaw === "" ? NaN : Number(categoryIdRaw);
  const contentHtml = String(formData.get("content_html") ?? "").trim();
  const coverImage = getFormFile(formData, "cover_image");

  if (!title) {
    return { success: false, error: "Tiêu đề không được để trống." };
  }
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { success: false, error: "Vui lòng chọn danh mục hợp lệ." };
  }
  if (!contentHtml) {
    return { success: false, error: "Nội dung bài viết không được để trống." };
  }
  if (coverImage && !coverImage.type.startsWith("image/")) {
    return { success: false, error: "Ảnh bìa phải là tệp hình ảnh." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  const { data: category, error: categoryError } = await supabase
    .from("article_categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError || !category) {
    return { success: false, error: categoryError?.message ?? "Danh mục không tồn tại." };
  }

  const { data: insertedArticle, error: insertError } = await supabase
    .from("articles")
    .insert({
      title,
      content: { html: contentHtml },
      category_id: categoryId,
      created_by: user.id,
    })
    .select("id, title, created_at")
    .maybeSingle();

  if (insertError || !insertedArticle) {
    return { success: false, error: insertError?.message ?? "Không thể tạo bài viết." };
  }

  const articleId = insertedArticle.id as string;
  let finalContentHtml = contentHtml;

  const mediaKeys = new Set<string>();
  const mediaKeyRegex = /data-media-key="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = mediaKeyRegex.exec(contentHtml)) !== null) {
    mediaKeys.add(match[1]);
  }

  for (const key of mediaKeys) {
    const file = getFormFile(formData, `media_${key}`);
    if (!file) continue;

    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const filePath = `articles/${articleId}/${crypto.randomUUID()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("assets")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      console.error("Failed to upload editor media:", uploadError);
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("assets").getPublicUrl(filePath);

    if (!publicUrl) {
      console.error("Failed to resolve public URL for editor media:", filePath);
      continue;
    }

    const escapedKey = escapeRegExp(key);
    const tagRegex = new RegExp(
      `<(img|video)\\b([^>]*?)\\sdata-media-key="${escapedKey}"([^>]*?)>`,
      "g"
    );
    finalContentHtml = finalContentHtml.replace(tagRegex, (_match, tag, before, after) => {
      const attrs = `${before} ${after}`
        .replace(/\s+src="[^"]*"/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const space = attrs ? ` ${attrs}` : "";
      return `<${tag}${space} src="${publicUrl}">`;
    });
  }

  let coverImageId: string | null = null;
  if (coverImage) {
    const safeCoverName = coverImage.name.replace(/[^\w.\-]/g, "_");
    const coverPath = `articles/${articleId}/${crypto.randomUUID()}_${safeCoverName}`;

    const { data: coverUpload, error: coverError } = await supabase.storage
      .from("assets")
      .upload(coverPath, coverImage, { upsert: false });

    if (coverError || !coverUpload?.id) {
      return {
        success: false,
        error: coverError?.message ?? "Không thể tải ảnh bìa lên bucket assets.",
      };
    }

    coverImageId = coverUpload.id;
  }

  const updatePayload: Record<string, unknown> = {
    content: { html: finalContentHtml },
  };
  if (coverImageId) {
    updatePayload.cover_image_id = coverImageId;
  }

  const { error: updateError } = await supabase
    .from("articles")
    .update(updatePayload)
    .eq("id", articleId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/articles");

  return {
    success: true,
    article: {
      id: articleId,
      title: insertedArticle.title,
      created_at: insertedArticle.created_at,
    },
  };
}
