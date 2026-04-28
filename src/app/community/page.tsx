import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { CreatePostBar } from "@/components/create-post-bar";
import { PostFeed } from "@/components/post-feed";
import { Surface } from "@heroui/react";
import { COMMUNITY_POSTS_PAGE_SIZE, fetchCommunityPostsPageForUser } from "./data";

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const displayName = user.user_metadata?.display_name || user.email || "";
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U";

  const initialPostsPage = await fetchCommunityPostsPageForUser(user.id, 0, COMMUNITY_POSTS_PAGE_SIZE);

  return (
    <Surface variant="default" className="flex flex-col md:flex-row h-screen w-full">
      <Sidebar />
      <Surface variant="default" className="flex-1 h-full overflow-y-auto px-3 py-4 pb-20 sm:pb-4 md:p-6 bg-default-50/50">
        <Surface variant="transparent" className="w-full max-w-2xl mx-auto flex flex-col gap-6">
          <CreatePostBar
            userId={user.id}
            displayName={displayName}
            avatarFallback={avatarFallback}
          />
          <PostFeed
            posts={initialPostsPage.posts}
            hasMore={initialPostsPage.hasMore}
            currentUserId={user.id}
          />
        </Surface>
      </Surface>
    </Surface>
  );
}