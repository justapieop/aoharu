import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { CreatePostBar } from "@/components/create-post-bar";
import { PostFeed } from "@/components/post-feed";
import { Surface } from "@heroui/react";

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const displayName = user.user_metadata?.display_name || user.email || "";
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U";

  // Fetch posts ordered by newest first
  const { data: posts } = await supabase
    .from("posts")
    .select("id, content, created_at, posted_by")
    .order("created_at", { ascending: false })
    .limit(20);

  // Build the feed data with author info and attachments
  const feedPosts = await Promise.all(
    (posts ?? []).map(async (post) => {
      // Get author avatar from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar, display_name")
        .eq("id", post.posted_by)
        .single();

      const authorName = profile?.display_name || post.posted_by.slice(0, 8);

      const { data: attachmentRows } = await supabase
        .from("post_attachments")
        .select("attachment_id")
        .eq("post_id", post.id);

      const attachments: { url: string; name: string; type: string }[] = [];

      if (attachmentRows && attachmentRows.length > 0) {
        // List files in the post's storage directory
        const { data: files } = await supabase.storage
          .from("assets")
          .list(post.id);

        if (files && files.length > 0) {
          for (const file of files) {
            const { data: signedData } = await supabase.storage
              .from("assets")
              .createSignedUrl(`${post.id}/${file.name}`, 3600);

            if (signedData?.signedUrl) {
              attachments.push({
                url: signedData.signedUrl,
                name: file.name,
                type: file.metadata?.mimetype || "image/jpeg",
              });
            }
          }
        }
      }

      return {
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        posted_by: post.posted_by,
        author_name: authorName,
        author_avatar_url: `/api/avatar/${post.posted_by}`,
        author_fallback: authorName.charAt(0).toUpperCase() || "U",
        attachments,
      };
    })
  );

  return (
    <Surface variant="default" className="flex flex-col md:flex-row h-screen w-full">
      <Sidebar />
      <Surface variant="default" className="flex-1 h-full overflow-y-auto px-3 py-4 pb-20 sm:pb-4 md:p-6">
        <Surface variant="default" className="w-full max-w-3xl mx-auto flex flex-col gap-4">
          <CreatePostBar
            userId={user.id}
            displayName={displayName}
            avatarFallback={avatarFallback}
          />
          <PostFeed posts={feedPosts} />
        </Surface>
      </Surface>
    </Surface>
  );
}