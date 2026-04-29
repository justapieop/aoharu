import "server-only";

import { createClient } from "@/lib/supabase/server";

export const COMMUNITY_POSTS_PAGE_SIZE = 5;

export interface CommunityPostAttachment {
  url: string;
  name: string;
  type: string;
}

export interface CommunityPostComment {
  id: string;
  content: string;
  commented_by: string;
  author_name: string;
  author_avatar_url: string;
  author_fallback: string;
  attachment: {
    id: string;
    url: string;
    name: string;
    type: string;
  } | null;
}

export interface CommunityPost {
  id: string;
  content: string;
  created_at: string;
  posted_by: string;
  author_name: string;
  author_avatar_url: string;
  author_fallback: string;
  attachments: CommunityPostAttachment[];
  liked: boolean;
  reactionCount: number;
  comments: CommunityPostComment[];
}

export interface CommunityPostsPage {
  posts: CommunityPost[];
  hasMore: boolean;
}

export async function fetchCommunityPostsPageForUser(
  userId: string,
  offset: number,
  limit: number = COMMUNITY_POSTS_PAGE_SIZE,
): Promise<CommunityPostsPage> {
  const supabase = await createClient();

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);
  const queryLimit = safeLimit + 1;

  const { data: postRows } = await supabase
    .from("posts")
    .select("id, content, created_at, posted_by")
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + queryLimit - 1);

  const hasMore = (postRows?.length ?? 0) > safeLimit;
  const pagePosts = (postRows ?? []).slice(0, safeLimit);

  const posts = await Promise.all(
    pagePosts.map(async (post) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", post.posted_by)
        .single();

      const authorName = profile?.display_name || post.posted_by.slice(0, 8);

      const attachments: CommunityPostAttachment[] = [];

      const { data: attachmentRows } = await supabase
        .from("post_attachments")
        .select("attachment_id")
        .eq("post_id", post.id);

      const attachmentIdSet = new Set((attachmentRows ?? []).map((row) => row.attachment_id));

      // Posts created after the storage-path fix live at `${post.id}/...`,
      // while older ones live at `posts/${post.id}/...`. Look in both folders
      // and rely on the attachment_id set to filter to the right files.
      const candidateFolders = [post.id, `posts/${post.id}`];
      const matchedAttachmentIds = new Set<string>();

      for (const folder of candidateFolders) {
        if (matchedAttachmentIds.size === attachmentIdSet.size) {
          break;
        }

        const { data: files } = await supabase.storage
          .from("assets")
          // `list()` defaults to 100 items; bump it so a post with many
          // attachments doesn't silently drop the tail.
          .list(folder, { limit: 1000, sortBy: { column: "name", order: "asc" } });

        if (!files || files.length === 0) {
          continue;
        }

        for (const file of files) {
          if (!file.id || !attachmentIdSet.has(file.id) || matchedAttachmentIds.has(file.id)) {
            continue;
          }

          const { data: publicData } = supabase.storage
            .from("assets")
            .getPublicUrl(`${folder}/${file.name}`);

          if (publicData?.publicUrl) {
            attachments.push({
              url: publicData.publicUrl,
              name: file.name,
              type: file.metadata?.mimetype || "image/jpeg",
            });
            matchedAttachmentIds.add(file.id);
          }
        }
      }

      // Stable, deterministic order across requests so the gallery doesn't
      // shuffle. Filenames are `${uuid}_${original}`, so name-based sort is
      // effectively arbitrary but at least consistent.
      attachments.sort((a, b) => a.name.localeCompare(b.name));

      const { data: reactionRows } = await supabase
        .from("post_reactions")
        .select("post_id")
        .eq("post_id", post.id)
        .eq("user_id", userId)
        .limit(1);

      const { count: reactionCount } = await supabase
        .from("post_reactions")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      const { data: commentRows } = await supabase
        .from("post_comments")
        .select("id, content, commented_by, attachment_id")
        .eq("post_id", post.id);

      const comments: CommunityPostComment[] = await Promise.all(
        (commentRows ?? []).map(async (comment) => {
          let commentAttachment: {
            id: string;
            url: string;
            name: string;
            type: string;
          } | null = null;

          if (comment.attachment_id) {
            const { data: commentFiles } = await supabase.storage
              .from("assets")
              .list(`${post.id}/comments/${comment.id}`);

            const matchedFile = (commentFiles ?? []).find((file) => file.id === comment.attachment_id);

            if (matchedFile) {
              const commentAttachmentPath = `${post.id}/comments/${comment.id}/${matchedFile.name}`;

              const { data: publicData } = supabase.storage
                .from("assets")
                .getPublicUrl(commentAttachmentPath);

              if (publicData?.publicUrl) {
                commentAttachment = {
                  id: comment.attachment_id,
                  url: publicData.publicUrl,
                  name: matchedFile.name,
                  type: matchedFile.metadata?.mimetype || "image/jpeg",
                };
              }
            }
          }

          const { data: commenterProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", comment.commented_by)
            .single();

          const commenterName = commenterProfile?.display_name || comment.commented_by.slice(0, 8);

          return {
            id: comment.id,
            content: comment.content,
            commented_by: comment.commented_by,
            author_name: commenterName,
            author_avatar_url: `/api/avatar/${comment.commented_by}`,
            author_fallback: commenterName.charAt(0).toUpperCase() || "U",
            attachment: commentAttachment,
          };
        })
      );

      return {
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        posted_by: post.posted_by,
        author_name: authorName,
        author_avatar_url: `/api/avatar/${post.posted_by}`,
        author_fallback: authorName.charAt(0).toUpperCase() || "U",
        attachments,
        liked: (reactionRows?.length ?? 0) > 0,
        reactionCount: reactionCount ?? 0,
        comments,
      };
    })
  );

  return {
    posts,
    hasMore,
  };
}