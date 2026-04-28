"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Avatar, Button, Card, InputGroup, Modal, Separator, TextField, ToggleButton } from "@heroui/react";
import {
  ChatBubbleLeftRightIcon as CommentIcon,
  HeartIcon as HeartOutline,
  PhotoIcon,
  TrashIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { createCommentAction, deleteCommentAction, deletePostAction, loadMorePostsAction, toggleReactionAction } from "@/app/community/actions";

interface PostAttachment {
  url: string;
  name: string;
  type: string;
}

interface PostComment {
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

interface PostData {
  id: string;
  content: string;
  created_at: string;
  posted_by: string;
  author_name: string;
  author_avatar_url: string;
  author_fallback: string;
  attachments: PostAttachment[];
  liked: boolean;
  reactionCount: number;
  comments: PostComment[];
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

export function PostCard({
  post,
  canDelete,
  currentUserId,
  onDelete,
}: {
  post: PostData;
  canDelete: boolean;
  currentUserId: string;
  onDelete: (postId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [isCommentPending, startCommentTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [comments, setComments] = useState(post.comments);
  const [deletingCommentIds, setDeletingCommentIds] = useState<Record<string, boolean>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [commentAttachment, setCommentAttachment] = useState<File | null>(null);
  const commentAttachmentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setComments(post.comments);
  }, [post.comments]);

  const [optimistic, setOptimistic] = useOptimistic(
    { liked: post.liked, count: post.reactionCount },
    (_current, newLiked: boolean) => ({
      liked: newLiked,
      count: newLiked ? _current.count + 1 : _current.count - 1,
    })
  );

  function handleToggle() {
    const previousLiked = optimistic.liked;
    const newLiked = !previousLiked;

    startTransition(async () => {
      setOptimistic(newLiked);

      const result = await toggleReactionAction(post.id);
      if (!result?.success) {
        // Roll back optimistic state when the server write fails.
        setOptimistic(previousLiked);
        console.error("Failed to toggle reaction:", result?.error || "Unknown error");
      }
    });
  }

  function handleCreateComment() {
    const draft = commentDraft.trim();
    if (!draft && !commentAttachment) {
      return;
    }

    startCommentTransition(async () => {
      const commentFormData = new FormData();
      commentFormData.set("content", commentDraft);

      if (commentAttachment) {
        commentFormData.set("attachment", commentAttachment);
      }

      const result = await createCommentAction(post.id, commentFormData);

      if (!result?.success || !result.comment) {
        console.error("Failed to create comment:", result?.error || "Unknown error");
        return;
      }

      setComments((prev) => [...prev, result.comment]);
      setCommentDraft("");
      setCommentAttachment(null);
      if (commentAttachmentInputRef.current) {
        commentAttachmentInputRef.current.value = "";
      }
    });
  }

  function handleDeletePost() {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    startDeleteTransition(async () => {
      await onDelete(post.id);
    });
  }

  function handleDeleteComment(commentId: string) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    setDeletingCommentIds((prev) => ({ ...prev, [commentId]: true }));

    startCommentTransition(async () => {
      const result = await deleteCommentAction(post.id, commentId);

      if (!result?.success) {
        console.error("Failed to delete comment:", result?.error || "Unknown error");
        setDeletingCommentIds((prev) => {
          const next = { ...prev };
          delete next[commentId];
          return next;
        });
        return;
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setDeletingCommentIds((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    });
  }

  function openCommentAttachmentPicker(accept: string) {
    if (!commentAttachmentInputRef.current) {
      return;
    }

    commentAttachmentInputRef.current.accept = accept;
    commentAttachmentInputRef.current.click();
  }

  function handleCommentAttachmentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      event.target.value = "";
      return;
    }

    setCommentAttachment(file);
    event.target.value = "";
  }

  return (
    <Card className="w-full border border-default-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl bg-white overflow-hidden">
      <Card.Header className="flex flex-row items-center gap-3 px-5 pt-5 pb-3">
        <Avatar size="sm" className="shrink-0 border border-default-100 shadow-sm">
          <Avatar.Image src={post.author_avatar_url} alt="Avatar" className="object-cover" />
          <Avatar.Fallback>{post.author_fallback}</Avatar.Fallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-foreground">{post.author_name}</span>
          <span className="text-xs text-default-400 font-medium">{timeAgo(post.created_at)}</span>
        </div>
        {canDelete && (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Xóa bài viết"
            isDisabled={isDeletePending}
            isPending={isDeletePending}
            onPress={handleDeletePost}
            className="ml-auto text-default-400 hover:text-danger hover:bg-danger/10"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        )}
      </Card.Header>

      <Card.Content className="px-5 py-2">
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-default-700">{post.content}</p>
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

      <Separator className="opacity-50" />

      <Card.Footer className="flex flex-row items-center gap-4 px-5 py-3 bg-default-50/30">
        <div className="flex items-center">
          <ToggleButton
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="Like"
            isSelected={optimistic.liked}
            isDisabled={isPending}
            onPress={handleToggle}
            className="rounded-full hover:bg-danger/10 data-[selected=true]:text-danger transition-transform active:scale-95"
          >
            {optimistic.liked ? (
              <HeartSolid className="w-5 h-5" />
            ) : (
              <HeartOutline className="w-5 h-5 text-default-500" />
            )}
          </ToggleButton>
          {optimistic.count > 0 && (
            <span className="text-sm font-medium text-default-500 ml-1.5">{optimistic.count}</span>
          )}
        </div>

        <Modal>
          <Modal.Trigger>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Comment"
              className="rounded-full hover:bg-accent/10 text-default-500 hover:text-accent font-medium px-3"
            >
              <CommentIcon className="w-5 h-5 mr-1" />
              <span>Bình luận</span>
            </Button>
          </Modal.Trigger>

          <Modal.Backdrop>
            <Modal.Container placement="center" size="lg">
              <Modal.Dialog>
                <Modal.CloseTrigger />

                <Modal.Header className="text-center">
                  <Modal.Heading>Bài viết</Modal.Heading>
                </Modal.Header>

                <Modal.Body className="p-0">
                  <div className="max-h-[80vh] overflow-y-auto">
                    <div className="p-4 md:p-5">
                      <div className="flex flex-row items-center gap-3 mb-3">
                        <Avatar size="sm" className="shrink-0">
                          <Avatar.Image src={post.author_avatar_url} alt="Avatar" className="object-cover" />
                          <Avatar.Fallback>{post.author_fallback}</Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{post.author_name}</span>
                          <span className="text-xs text-default-400">{timeAgo(post.created_at)}</span>
                        </div>
                      </div>

                      <p className="text-sm whitespace-pre-wrap mb-4">{post.content}</p>

                      {post.attachments.length > 0 && (
                        <div className={`grid gap-2 ${post.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                          {post.attachments.map((attachment, i) => (
                            <div key={i} className="rounded-lg overflow-hidden bg-default-100">
                              {attachment.type.startsWith("video/") ? (
                                <video
                                  src={attachment.url}
                                  controls
                                  className="w-full max-h-[55vh] object-cover"
                                />
                              ) : (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="w-full max-h-[55vh] object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="p-4 md:p-5 flex flex-col min-h-72">
                      <div className="text-sm font-semibold mb-3">Bình luận</div>

                      <div className="flex-1 overflow-y-auto rounded-2xl bg-default-50 p-4 border border-default-100 shadow-inner">
                        {comments.length === 0 ? (
                          <p className="text-sm text-default-500 text-center mt-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {comments.map((comment) => (
                              <div key={comment.id} className="flex items-start gap-3">
                                <Avatar size="sm" className="shrink-0 mt-0.5 shadow-sm">
                                  <Avatar.Image src={comment.author_avatar_url} alt="Avatar" className="object-cover" />
                                  <Avatar.Fallback>{comment.author_fallback}</Avatar.Fallback>
                                </Avatar>
                                <div className="flex flex-col max-w-[85%]">
                                  <div className="rounded-2xl bg-white border border-default-200 px-4 py-2.5 shadow-sm">
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                      <p className="text-[13px] font-bold text-foreground">{comment.author_name}</p>
                                      {comment.commented_by === currentUserId && (
                                        <Button
                                          isIconOnly
                                          size="sm"
                                          variant="ghost"
                                          aria-label="Xóa bình luận"
                                          isPending={!!deletingCommentIds[comment.id]}
                                          isDisabled={!!deletingCommentIds[comment.id]}
                                          onPress={() => handleDeleteComment(comment.id)}
                                          className="h-6 w-6 min-w-6 text-default-400 hover:text-danger hover:bg-danger/10 rounded-full"
                                        >
                                          <TrashIcon className="w-3.5 h-3.5" />
                                        </Button>
                                      )}
                                    </div>

                                    {comment.content.trim().length > 0 && (
                                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-default-700">{comment.content}</p>
                                    )}
                                  </div>

                                  {comment.attachment && (
                                    <div className="mt-2 overflow-hidden rounded-xl bg-default-200 border border-default-200 shadow-sm max-w-sm">
                                      {comment.attachment.type.startsWith("video/") ? (
                                        <video
                                          src={comment.attachment.url}
                                          controls
                                          className="w-full max-h-60 object-cover"
                                        />
                                      ) : (
                                        <img
                                          src={comment.attachment.url}
                                          alt={comment.attachment.name}
                                          className="w-full max-h-60 object-cover"
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <TextField
                          aria-label="Viết bình luận"
                          value={commentDraft}
                          onChange={setCommentDraft}
                          isDisabled={isCommentPending}
                        >
                          <InputGroup variant="secondary" fullWidth>
                            <InputGroup.TextArea
                              rows={2}
                              placeholder="Viết bình luận..."
                              className="resize-none"
                            />
                          </InputGroup>
                        </TextField>

                        {commentAttachment && (
                          <div className="mt-2 flex items-center justify-between rounded-lg bg-default-100 px-3 py-2">
                            <span className="text-xs text-default-600 truncate">{commentAttachment.name}</span>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="ghost"
                              aria-label="Bỏ tệp đính kèm"
                              onPress={() => setCommentAttachment(null)}
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="ghost"
                              aria-label="Thêm ảnh bình luận"
                              isDisabled={isCommentPending}
                              onPress={() => openCommentAttachmentPicker("image/*")}
                            >
                              <PhotoIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="ghost"
                              aria-label="Thêm video bình luận"
                              isDisabled={isCommentPending}
                              onPress={() => openCommentAttachmentPicker("video/*")}
                            >
                              <VideoCameraIcon className="w-4 h-4" />
                            </Button>
                          </div>

                          <input
                            ref={commentAttachmentInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleCommentAttachmentChange}
                          />
                        </div>

                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            variant="primary"
                            isPending={isCommentPending}
                            isDisabled={commentDraft.trim().length === 0 && !commentAttachment}
                            onPress={handleCreateComment}
                          >
                            Bình luận
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </Card.Footer>
    </Card>
  );
}

export function PostFeed({ posts, hasMore, currentUserId }: { posts: PostData[]; hasMore: boolean; currentUserId: string }) {
  const [loadedPosts, setLoadedPosts] = useState(posts);
  const [hasMorePosts, setHasMorePosts] = useState(hasMore);
  const [isLoadingMore, startLoadingMoreTransition] = useTransition();
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    setLoadedPosts(posts);
    setHasMorePosts(hasMore);
    requestInFlightRef.current = false;
  }, [posts, hasMore]);

  async function handleDeletePost(postId: string) {
    const result = await deletePostAction(postId);

    if (!result?.success) {
      console.error("Failed to delete post:", result?.error || "Unknown error");
      return;
    }

    setLoadedPosts((prev) => prev.filter((post) => post.id !== postId));
  }

  useEffect(() => {
    const node = loadMoreTriggerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (!firstEntry?.isIntersecting || !hasMorePosts || requestInFlightRef.current) {
          return;
        }

        requestInFlightRef.current = true;

        startLoadingMoreTransition(async () => {
          const result = await loadMorePostsAction(loadedPosts.length);

          if (!result?.success) {
            console.error("Failed to load more posts:", result?.error || "Unknown error");
            requestInFlightRef.current = false;
            return;
          }

          setLoadedPosts((prev) => [...prev, ...result.posts]);
          setHasMorePosts(result.hasMore);
          requestInFlightRef.current = false;
        });
      },
      {
        root: null,
        rootMargin: "200px 0px",
        threshold: 0,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMorePosts, loadedPosts.length, startLoadingMoreTransition]);

  if (loadedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-default-400">
        <p className="text-lg font-medium">Chưa có bài viết nào</p>
        <p className="text-sm">Hãy là người đầu tiên chia sẻ!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {loadedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          canDelete={post.posted_by === currentUserId}
          currentUserId={currentUserId}
          onDelete={handleDeletePost}
        />
      ))}

      {hasMorePosts && (
        <div ref={loadMoreTriggerRef} className="py-2 text-center text-xs text-default-400">
          {isLoadingMore ? "Đang tải thêm bài viết..." : "Cuộn xuống để tải thêm"}
        </div>
      )}

      {!hasMorePosts && loadedPosts.length > 0 && (
        <div className="py-2 text-center text-xs text-default-400">Bạn đã xem hết bài viết.</div>
      )}
    </div>
  );
}
