"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { COMMUNITY_POSTS_PAGE_SIZE, fetchCommunityPostsPageForUser } from "./data";

export async function toggleReactionAction(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  // Check if user already reacted without assuming uniqueness.
  const { data: existingRows, error: existingError } = await supabase
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .limit(1);

  if (existingError) {
    return { success: false, error: existingError.message };
  }

  const hasExistingReaction = (existingRows?.length ?? 0) > 0;

  if (hasExistingReaction) {
    // Already liked → remove reaction
    const { error: deleteError, count: deletedCount } = await supabase
      .from("post_reactions")
      .delete({ count: "exact" })
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    if ((deletedCount ?? 0) === 0) {
      return { success: false, error: "Không thể bỏ reaction. Vui lòng kiểm tra RLS policy cho DELETE trên post_reactions." };
    }

    revalidatePath("/community");
    return { success: true, liked: false };
  } else {
    // Not liked → insert reaction
    const { error: insertError } = await supabase
      .from("post_reactions")
      .upsert(
        { post_id: postId, user_id: user.id },
        { onConflict: "post_id,user_id", ignoreDuplicates: true }
      );

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    revalidatePath("/community");
    return { success: true, liked: true };
  }
}

export async function createCommentAction(postId: string, formData: FormData) {
  const rawContent = formData.get("content");
  const trimmedContent = typeof rawContent === "string" ? rawContent.trim() : "";
  const rawAttachment = formData.get("attachment");
  const attachmentFile = rawAttachment instanceof File && rawAttachment.size > 0 ? rawAttachment : null;

  if (!trimmedContent && !attachmentFile) {
    return { success: false, error: "Bình luận cần có nội dung hoặc 1 ảnh/video." };
  }

  if (attachmentFile && !attachmentFile.type.startsWith("image/") && !attachmentFile.type.startsWith("video/")) {
    return { success: false, error: "Chỉ hỗ trợ 1 tệp ảnh hoặc video cho bình luận." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  const { data: insertedComment, error: insertError } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      content: trimmedContent || null,
      commented_by: user.id,
    })
    .select("id, content, commented_by")
    .single();

  if (insertError || !insertedComment) {
    return { success: false, error: insertError?.message || "Không thể tạo bình luận." };
  }

  let commentAttachment: {
    id: string;
    url: string;
    name: string;
    type: string;
  } | null = null;

  if (attachmentFile) {
    const attachmentPath = `${postId}/comments/${insertedComment.id}/${crypto.randomUUID()}_${attachmentFile.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("assets")
      .upload(attachmentPath, attachmentFile, { upsert: false });

    if (uploadError || !uploadData?.id) {
      if (!trimmedContent) {
        await supabase
          .from("post_comments")
          .delete()
          .eq("id", insertedComment.id)
          .eq("commented_by", user.id);
      }

      return { success: false, error: uploadError?.message || "Không thể tải tệp bình luận." };
    }

    const { data: updatedCommentRow, error: updateAttachmentError } = await supabase
      .from("post_comments")
      .update({ attachment_id: uploadData.id })
      .eq("id", insertedComment.id)
      .eq("commented_by", user.id)
      .select("id, attachment_id")
      .maybeSingle();

    if (updateAttachmentError) {
      return { success: false, error: updateAttachmentError.message };
    }

    if (!updatedCommentRow) {
      return {
        success: false,
        error: "Không thể cập nhật attachment_id cho bình luận. Vui lòng kiểm tra RLS policy UPDATE trên post_comments.",
      };
    }

    const { data: publicData } = supabase.storage
      .from("assets")
      .getPublicUrl(attachmentPath);

    commentAttachment = {
      id: uploadData.id,
      url: publicData?.publicUrl || "",
      name: attachmentFile.name,
      type: attachmentFile.type,
    };
  }

  const { data: commenterProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const commenterName = commenterProfile?.display_name || user.email || user.id.slice(0, 8);

  revalidatePath("/community");

  return {
    success: true,
    comment: {
      id: insertedComment.id,
      content: insertedComment.content || "",
      commented_by: insertedComment.commented_by,
      author_name: commenterName,
      author_avatar_url: `/api/avatar/${insertedComment.commented_by}`,
      author_fallback: commenterName.charAt(0).toUpperCase() || "U",
      attachment: commentAttachment,
    },
  };
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
      const uploadedAttachmentIds: string[] = [];

      for (const file of files) {
        const filePath = `${post.id}/${crypto.randomUUID()}_${file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("assets")
          .upload(filePath, file, { upsert: false });

        if (uploadError || !uploadData?.id) {
          console.error("Upload failed for file:", file.name, uploadError);
          continue;
        }

        uploadedAttachmentIds.push(uploadData.id);
      }

      if (uploadedAttachmentIds.length > 0) {
        const rows = uploadedAttachmentIds.map((attachmentId) => ({
          post_id: post.id,
          attachment_id: attachmentId,
        }));

        const { error: linkError } = await supabase
          .from("post_attachments")
          .upsert(rows, {
            onConflict: "post_id,attachment_id",
            ignoreDuplicates: true,
          });

        if (linkError) {
          throw linkError;
        }
      }
    }

    return { success: true, postId: post.id };
  } catch (error: any) {
    console.error("Lỗi khi tạo bài viết:", error);
    return { success: false, error: error.message || "Đã xảy ra lỗi hệ thống." };
  }
}

export async function loadMorePostsAction(offset: number) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập.", posts: [], hasMore: false };
  }

  const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.trunc(offset)) : 0;
  const page = await fetchCommunityPostsPageForUser(user.id, safeOffset, COMMUNITY_POSTS_PAGE_SIZE);

  return {
    success: true,
    posts: page.posts,
    hasMore: page.hasMore,
  };
}

export async function deletePostAction(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  const { error: deleteError, count: deletedCount } = await supabase
    .from("posts")
    .delete({ count: "exact" })
    .eq("id", postId)
    .eq("posted_by", user.id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  if ((deletedCount ?? 0) === 0) {
    return { success: false, error: "Không thể xóa bài viết này." };
  }

  revalidatePath("/community");
  return { success: true };
}

export async function deleteCommentAction(postId: string, commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  const { data: ownedComment, error: ownershipError } = await supabase
    .from("post_comments")
    .select("id")
    .eq("id", commentId)
    .eq("post_id", postId)
    .eq("commented_by", user.id)
    .maybeSingle();

  if (ownershipError) {
    return { success: false, error: ownershipError.message };
  }

  if (!ownedComment) {
    return { success: false, error: "Bạn chỉ có thể xóa bình luận của mình." };
  }

  const commentFolder = `${postId}/comments/${commentId}`;
  const { data: attachmentFiles, error: attachmentListError } = await supabase.storage
    .from("assets")
    .list(commentFolder, { limit: 100 });

  // Storage cleanup is best-effort so DB delete is not blocked by bucket policy issues.
  if (!attachmentListError) {
    const attachmentPaths = (attachmentFiles ?? [])
      .filter((file) => !!file.id)
      .map((file) => `${commentFolder}/${file.name}`);

    if (attachmentPaths.length > 0) {
      const { error: storageDeleteError } = await supabase.storage
        .from("assets")
        .remove(attachmentPaths);

      if (storageDeleteError) {
        console.error("Failed to remove comment attachments:", storageDeleteError.message);
      }
    }
  } else {
    console.error("Failed to list comment attachments:", attachmentListError.message);
  }

  const { error: deleteError, count: deletedCount } = await supabase
    .from("post_comments")
    .delete({ count: "exact" })
    .eq("id", commentId)
    .eq("post_id", postId)
    .eq("commented_by", user.id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  if ((deletedCount ?? 0) === 0) {
    return { success: false, error: "Không thể xóa bình luận này." };
  }

  revalidatePath("/community");
  return { success: true };
}
