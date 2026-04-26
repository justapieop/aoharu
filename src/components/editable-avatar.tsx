"use client";

import { useRef, useState, useEffect } from "react";
import { Avatar, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { uploadAvatarAction } from "@/app/profile/actions";

interface EditableAvatarProps {
  userId: string;
  fallback: string;
}

export function EditableAvatar({ userId, fallback }: EditableAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [version, setVersion] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const avatarUrl = `/api/avatar/${userId}?v=${version}`;

  useEffect(() => {
    // Listen for cross-component avatar updates seamlessly mapped in browser memory
    const handleAvatarUpdate = () => {
      setVersion(Date.now());
    };
    window.addEventListener("avatarUpdated", handleAvatarUpdate);
    return () => window.removeEventListener("avatarUpdated", handleAvatarUpdate);
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Package into standard FormData structure natively passing directly into Next.js Server Actions
      const formData = new FormData();
      formData.append("file", file);

      // Execute safely guarded explicit size checks and buffer conversions
      const response = await uploadAvatarAction(formData);

      if (!response.success) {
        throw new Error(response.error);
      }

      // Automatically bypass stale browser cache visually by forcing a new ?v= parameter
      setVersion(Date.now());
      
      // Dispatch standard global JS browser Event strictly for real-time sidebar syncing
      window.dispatchEvent(new Event("avatarUpdated"));
      
      // Tell Next.js Server Components safely to sync layouts
      router.refresh();

    } catch (error: any) {
      console.error(error);
      alert(error.message || "Đã xảy ra lỗi hệ thống. Vui lòng thiết lập kiểm tra Postgres limit.");
    } finally {
      setIsUploading(false);
      // Effectively explicitly reset the DOM element for successive sequential updates
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div 
      className="relative group cursor-pointer inline-block shrink-0" 
      onClick={() => !isUploading && fileInputRef.current?.click()}
      title="Nhấn để đổi ảnh đại diện (Tối đa 5MB)"
    >
      <div className="relative rounded-full overflow-hidden">
        <Avatar 
          size="lg" 
          className={`h-20 w-20 text-large border border-default-200 transition-opacity ${isUploading ? 'opacity-40' : 'group-hover:opacity-80'}`}
        >
          <Avatar.Image src={avatarUrl} alt="Avatar" className="object-cover" />
          <Avatar.Fallback>{fallback}</Avatar.Fallback>
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Spinner size="sm" color="current" />
          </div>
        )}

        {!isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
