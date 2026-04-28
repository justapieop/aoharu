"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { uploadChallengeEvidenceAction } from "../actions";

interface UploadEvidenceFormProps {
  entryId: string;
  hasUploadedToday: boolean;
}

export function UploadEvidenceForm({ entryId, hasUploadedToday }: UploadEvidenceFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entry_id", entryId);

    try {
      const res = await uploadChallengeEvidenceAction(formData);
      if (res.success) {
        alert("Tải lên minh chứng thành công!");
        setFile(null);
      } else {
        alert(res.error || "Lỗi khi tải lên.");
      }
    } catch (err) {
      alert("Đã xảy ra lỗi không xác định.");
    } finally {
      setIsUploading(false);
    }
  };

  if (hasUploadedToday) {
    return (
      <div className="mt-6 w-full p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
          <span className="text-2xl">✅</span>
        </div>
        <h3 className="text-emerald-800 font-bold">Bạn đã cập nhật minh chứng hôm nay!</h3>
        <p className="text-sm text-emerald-600 mt-1">Hãy tiếp tục phát huy vào ngày mai nhé.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpload} className="mt-6 w-full flex flex-col gap-4 bg-default-50/50 p-4 rounded-2xl border border-default-100">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Tải lên minh chứng (Hình ảnh)</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className="w-full text-sm text-default-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100 cursor-pointer"
          required
        />
      </div>
      <Button 
        type="submit" 
        variant="primary" 
        isDisabled={!file || isUploading}
        className="w-full font-bold"
      >
        {isUploading ? "Đang tải lên..." : "Gửi minh chứng"}
      </Button>
    </form>
  );
}
