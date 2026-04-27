"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleReactionAction(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  // Check if user already reacted (EXISTS-style: select a single row or null)
  const { data: existing } = await supabase
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Already liked → remove reaction
    const { error: deleteError } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true, liked: false };
  } else {
    // Not liked → insert reaction
    const { error: insertError } = await supabase
      .from("post_reactions")
      .insert({ post_id: postId, user_id: user.id });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, liked: true };
  }
}

export async function createPostAction(formData: FormData) {
  const content = formData.get("content") as string | null;
  if (!content?.trim()) {
    return { success: false, error: "Nội dung bài viết không được để trống." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  try {
    // 1. Create the post record
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({ content: content.trim(), posted_by: user.id })
      .select("id")
      .single();

    if (postError || !post) {
      throw postError || new Error("Không thể tạo bài viết.");
    }

    // 2. Upload attachments to bucket "assets" under /{post_id}/
    const files: File[] = [];
    const entries = formData.getAll("attachments");
    for (const entry of entries) {
      if (entry instanceof File && entry.size > 0) {
        files.push(entry);
      }
    }

    if (files.length > 0) {
      const attachmentIds: string[] = [];

      for (const file of files) {
        const filePath = `${post.id}/${crypto.randomUUID()}_${file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("assets")
          .upload(filePath, file, { upsert: false });

        if (uploadError || !uploadData) {
          console.error("Upload failed for file:", file.name, uploadError);
          continue;
        }

        attachmentIds.push(uploadData.id);
      }

      // 3. Link attachments to the post via post_attachments
      if (attachmentIds.length > 0) {
        const rows = attachmentIds.map((attachmentId) => ({
          post_id: post.id,
          attachment_id: attachmentId,
        }));

        const { error: linkError } = await supabase
          .from("post_attachments")
          .insert(rows);

        if (linkError) {
          console.error("Failed to link attachments:", linkError);
        }
      }
    }

    return { success: true, postId: post.id };
  } catch (error: any) {
    console.error("Lỗi khi tạo bài viết:", error);
    return { success: false, error: error.message || "Đã xảy ra lỗi hệ thống." };
  }
}
