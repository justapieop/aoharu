"use client";

import { Avatar, Card, InputGroup, TextField, Modal, Button, Separator, Chip, CloseButton, Spinner } from "@heroui/react";
import { PhotoIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPostAction } from "@/app/community/actions";

interface CreatePostBarProps {
  userId: string;
  displayName: string;
  avatarFallback: string;
}

export function CreatePostBar({ userId, displayName, avatarFallback }: CreatePostBarProps) {
  const avatarUrl = `/api/avatar/${userId}`;
  const [postContent, setPostContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalInstanceKey, setModalInstanceKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!postContent.trim() && attachments.length === 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("content", postContent);
      for (const file of attachments) {
        formData.append("attachments", file);
      }

      const result = await createPostAction(formData);
      if (!result.success) {
        throw new Error(result.error);
      }

      setPostContent("");
      setAttachments([]);
      setModalInstanceKey((prev) => prev + 1);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Đã xảy ra lỗi khi đăng bài.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPost = postContent.trim().length > 0 || attachments.length > 0;

  return (
    <Modal key={modalInstanceKey}>
      <Modal.Trigger className="w-full">
        <div className="w-full cursor-pointer rounded-full bg-white shadow-sm border border-default-200 transition-all duration-300 hover:shadow-md hover:border-accent/30 flex flex-row items-center gap-3 p-2 sm:p-3 pr-4">
          <Avatar size="sm" className="shrink-0 border border-default-100 shadow-sm">
            <Avatar.Image src={avatarUrl} alt="Avatar" className="object-cover" />
            <Avatar.Fallback>{avatarFallback}</Avatar.Fallback>
          </Avatar>
          <div className="flex-1 text-sm text-default-400 font-medium truncate">
            {`Bạn đang nghĩ gì, ${displayName}?`}
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <div className="p-2 rounded-full hover:bg-default-100 transition-colors"><PhotoIcon className="w-5 h-5 text-success" /></div>
            <div className="p-2 rounded-full hover:bg-default-100 transition-colors"><VideoCameraIcon className="w-5 h-5 text-danger" /></div>
          </div>
        </div>
      </Modal.Trigger>

      <Modal.Backdrop>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header className="text-center">
              <Modal.Heading>Tạo bài viết</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar size="sm" className="shrink-0">
                  <Avatar.Image src={avatarUrl} alt="Avatar" className="object-cover" />
                  <Avatar.Fallback>{avatarFallback}</Avatar.Fallback>
                </Avatar>
                <span className="font-semibold text-sm">{displayName}</span>
              </div>

              <TextField
                aria-label="Nội dung bài viết"
                className="flex-1"
                value={postContent}
                onChange={setPostContent}
              >
                <InputGroup
                  variant="primary"
                  fullWidth
                  className="rounded-2xl border border-default-200 bg-default-50/50 shadow-inner"
                >
                  <InputGroup.TextArea
                    placeholder={`Bạn đang nghĩ gì, ${displayName}?`}
                    className="resize-none border-none bg-transparent px-4 py-3 shadow-none text-base md:text-lg min-h-32 placeholder:text-default-400 focus:ring-0"
                    rows={5}
                  />
                </InputGroup>
              </TextField>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <Chip key={index} variant="secondary">
                      <Chip.Label className="max-w-32 truncate">{file.name}</Chip.Label>
                      <CloseButton
                        onPress={() => removeAttachment(index)}
                        aria-label={`Xóa ${file.name}`}
                        className="ml-1 w-4 h-4"
                      />
                    </Chip>
                  ))}
                </div>
              )}
            </Modal.Body>

            <Separator />

            <Modal.Footer className="flex flex-col gap-3 p-4">
              <div className="rounded-2xl border border-default-200 bg-default-50/50 px-4 py-3 flex flex-row items-center justify-between">
                <span className="text-sm font-semibold text-default-700">Thêm vào bài viết</span>
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label="Ảnh"
                    className="text-success hover:bg-success/10"
                    onPress={() => handleFileSelect("image/*")}
                  >
                    <PhotoIcon className="w-5 h-5" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label="Video"
                    className="text-danger hover:bg-danger/10"
                    onPress={() => handleFileSelect("video/*")}
                  >
                    <VideoCameraIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <Button
                fullWidth
                variant="primary"
                isDisabled={!canPost}
                isPending={isSubmitting}
                onPress={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" color="current" />
                    Đang đăng...
                  </>
                ) : (
                  "Đăng"
                )}
              </Button>
            </Modal.Footer>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFilesChange}
            />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
