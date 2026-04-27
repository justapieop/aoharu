"use client";

import { Avatar, Card, Separator } from "@heroui/react";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";

interface PostAttachment {
  url: string;
  name: string;
  type: string;
}

interface PostData {
  id: string;
  content: string;
  created_at: string;
  posted_by: string;
  author_name: string;
  author_avatar_url: string;
  author_fallback: string;
  attachments: PostAttachment[];
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

export function PostCard({ post }: { post: PostData }) {
  return (
    <Card className="w-full">
      <Card.Header className="flex flex-row items-center gap-3 p-4 pb-2">
        <Avatar size="sm" className="shrink-0">
          <Avatar.Image src={post.author_avatar_url} alt="Avatar" className="object-cover" />
          <Avatar.Fallback>{post.author_fallback}</Avatar.Fallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{post.author_name}</span>
          <span className="text-xs text-default-400">{timeAgo(post.created_at)}</span>
        </div>
      </Card.Header>

      <Card.Content className="px-4 py-2">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
      </Card.Content>

      {post.attachments.length > 0 && (
        <div className="px-4 pb-2">
          <div className={`grid gap-2 ${post.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.attachments.map((attachment, i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-default-100">
                {attachment.type.startsWith("video/") ? (
                  <video
                    src={attachment.url}
                    controls
                    className="w-full max-h-96 object-cover"
                  />
                ) : (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full max-h-96 object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <Card.Footer className="flex flex-row items-center gap-2 px-4 py-2">
        <HeartOutline className="w-5 h-5 text-default-400 cursor-pointer hover:text-danger transition-colors" />
      </Card.Footer>
    </Card>
  );
}

export function PostFeed({ posts }: { posts: PostData[] }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-default-400">
        <p className="text-lg font-medium">Chưa có bài viết nào</p>
        <p className="text-sm">Hãy là người đầu tiên chia sẻ!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
