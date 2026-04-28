"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import type { Key } from "@heroui/react";
import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import {
  ListBulletIcon,
  NumberedListIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { createArticleAction } from "@/app/admin/articles/actions";
import type { ArticleCategory } from "@/components/category-manager";

interface ArticleCreateFormProps {
  categories: ArticleCategory[];
}

export function ArticleCreateForm({ categories }: ArticleCreateFormProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const mediaFilesRef = useRef<Map<string, File>>(new Map());
  const blobUrlsRef = useRef<Set<string>>(new Set());

  const [title, setTitle] = useState<string>("");
  const [categoryId, setCategoryId] = useState<Key | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const blobUrls = blobUrlsRef.current;
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
      blobUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const exec = (command: string, value?: string) => {
    focusEditor();
    document.execCommand(command, false, value);
  };

  const handleInsertHeading = () => {
    focusEditor();
    document.execCommand("formatBlock", false, "<H2>");
  };

  const handleInsertParagraph = () => {
    focusEditor();
    document.execCommand("formatBlock", false, "<P>");
  };

  const insertMedia = (kind: "image" | "video", file: File) => {
    const editor = editorRef.current;
    if (!editor) return;

    const key = crypto.randomUUID();
    const blobUrl = URL.createObjectURL(file);
    mediaFilesRef.current.set(key, file);
    blobUrlsRef.current.add(blobUrl);

    const safeAlt = file.name.replace(/"/g, "&quot;");
    const html =
      kind === "image"
        ? `<p><img src="${blobUrl}" data-media-key="${key}" alt="${safeAlt}" style="max-width:100%;height:auto;border-radius:8px;" /></p><p><br/></p>`
        : `<p><video src="${blobUrl}" data-media-key="${key}" controls style="max-width:100%;height:auto;border-radius:8px;"></video></p><p><br/></p>`;

    editor.focus();
    const inserted = document.execCommand("insertHTML", false, html);
    if (!inserted) {
      editor.insertAdjacentHTML("beforeend", html);
    }
  };

  const handleImageInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn tệp hình ảnh hợp lệ.");
      return;
    }
    insertMedia("image", file);
  };

  const handleVideoInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Vui lòng chọn tệp video hợp lệ.");
      return;
    }
    insertMedia("video", file);
  };

  const handleCoverInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setCoverFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Ảnh bìa phải là tệp hình ảnh.");
      event.target.value = "";
      return;
    }
    setCoverFile(file);
  };

  const clearCover = () => {
    setCoverFile(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategoryId(null);
    clearCover();
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    mediaFilesRef.current.clear();
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    if (categoryId == null || categoryId === "") {
      alert("Vui lòng chọn danh mục.");
      return;
    }

    const editor = editorRef.current;
    const html = editor?.innerHTML.trim() ?? "";
    const textContent = editor?.textContent?.trim() ?? "";
    const hasMedia = html.includes("data-media-key=");

    if (!html || (!textContent && !hasMedia)) {
      alert("Vui lòng nhập nội dung bài viết.");
      return;
    }

    const formData = new FormData();
    formData.set("title", trimmedTitle);
    formData.set("category_id", String(categoryId));
    formData.set("content_html", html);

    if (coverFile) {
      formData.set("cover_image", coverFile);
    }

    for (const [key, file] of mediaFilesRef.current.entries()) {
      if (html.includes(`data-media-key="${key}"`)) {
        formData.append(`media_${key}`, file);
      }
    }

    startTransition(async () => {
      const result = await createArticleAction(formData);

      if (!result.success || !result.article) {
        alert(result.error ?? "Không thể tạo bài viết.");
        return;
      }

      resetForm();
      alert("Đã tạo bài viết thành công.");
    });
  };

  const isDisabled = isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">Tạo bài viết</h2>
        <p className="mt-1 text-sm text-default-500">
          Sau khi gửi, bài viết được chèn vào bảng <code>articles</code>; mọi ảnh/video kèm theo sẽ được tải lên bucket <code>assets</code> dưới đường dẫn <code>articles/&#123;article_id&#125;/</code>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          isRequired
          value={title}
          onChange={setTitle}
          isDisabled={isDisabled}
          maxLength={200}
        >
          <Label>Tiêu đề</Label>
          <Input placeholder="Ví dụ: Hướng dẫn phân loại rác tại nguồn" />
        </TextField>

        <Select
          isRequired
          placeholder="Chọn danh mục"
          value={categoryId}
          onChange={(value) => setCategoryId(value)}
          isDisabled={isDisabled || categories.length === 0}
        >
          <Label>Danh mục</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {categories.map((category) => (
                <ListBox.Item
                  key={category.id}
                  id={String(category.id)}
                  textValue={category.name}
                >
                  {category.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Ảnh bìa (tùy chọn)</Label>
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-default-300 p-4">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverInput}
            disabled={isDisabled}
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-default-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold hover:file:bg-default-200"
          />
          {coverPreviewUrl ? (
            <div className="flex items-start gap-3">
              <div className="relative h-32 w-48 overflow-hidden rounded-lg border border-default-200 bg-default-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreviewUrl}
                  alt={coverFile?.name ?? "Ảnh bìa"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span className="truncate text-sm font-medium">{coverFile?.name}</span>
                <span className="text-xs text-default-500">
                  {coverFile ? `${(coverFile.size / 1024).toFixed(1)} KB` : null}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="self-start"
                  isDisabled={isDisabled}
                  onPress={clearCover}
                >
                  <XMarkIcon className="h-4 w-4" />
                  Xóa ảnh bìa
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-default-500">
              Khi gửi, ảnh bìa sẽ được tải lên <code>assets/articles/&#123;article_id&#125;/</code>, và <code>cover_image_id</code> sẽ được cập nhật bằng id trả về từ Supabase Storage.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Nội dung</Label>
        <div className="overflow-hidden rounded-xl border border-default-200">
          <div className="flex flex-wrap items-center gap-1 border-b border-default-200 bg-default-50 p-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={isDisabled}
              onPress={() => exec("bold")}
              aria-label="In đậm"
            >
              <span className="font-bold">B</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={isDisabled}
              onPress={() => exec("italic")}
              aria-label="In nghiêng"
            >
              <span className="italic">I</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={isDisabled}
              onPress={() => exec("underline")}
              aria-label="Gạch chân"
            >
              <span className="underline">U</span>
            </Button>
            <span className="mx-1 h-5 w-px bg-default-200" aria-hidden />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={isDisabled}
              onPress={handleInsertHeading}
              aria-label="Tiêu đề"
            >
              H2
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={isDisabled}
              onPress={handleInsertParagraph}
              aria-label="Đoạn văn"
            >
              P
            </Button>
            <span className="mx-1 h-5 w-px bg-default-200" aria-hidden />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={isDisabled}
              onPress={() => exec("insertUnorderedList")}
              aria-label="Danh sách"
            >
              <ListBulletIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={isDisabled}
              onPress={() => exec("insertOrderedList")}
              aria-label="Danh sách đánh số"
            >
              <NumberedListIcon className="h-4 w-4" />
            </Button>
            <span className="mx-1 h-5 w-px bg-default-200" aria-hidden />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={isDisabled}
              onPress={() => imageInputRef.current?.click()}
              aria-label="Chèn ảnh"
            >
              <PhotoIcon className="h-4 w-4" />
              Ảnh
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={isDisabled}
              onPress={() => videoInputRef.current?.click()}
              aria-label="Chèn video"
            >
              <VideoCameraIcon className="h-4 w-4" />
              Video
            </Button>
          </div>

          <div
            ref={editorRef}
            contentEditable={!isDisabled}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Nội dung bài viết"
            className="prose prose-sm max-w-none px-4 py-3 min-h-[260px] focus:outline-none [&_img]:max-w-full [&_video]:max-w-full"
            data-placeholder="Bắt đầu viết bài..."
          />

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageInput}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoInput}
          />
        </div>
        <p className="text-xs text-default-500">
          Ảnh và video chèn vào trình soạn thảo sẽ được tải lên Supabase Storage trong cùng thư mục với bài viết khi bạn gửi.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" isDisabled={isDisabled} onPress={resetForm}>
          Đặt lại
        </Button>
        <Button type="submit" variant="primary" isPending={isPending}>
          Tạo bài viết
        </Button>
      </div>
    </form>
  );
}
