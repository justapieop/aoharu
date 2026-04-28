"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { joinChallengeAction } from "./actions";

interface JoinButtonProps {
  challengeId: string;
  isEnded: boolean;
  hasJoined: boolean;
  isUpcoming: boolean;
}

export function JoinButton({ challengeId, isEnded, hasJoined, isUpcoming }: JoinButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const res = await joinChallengeAction(challengeId);
      if (!res.success) {
        alert(res.error);
      }
      // If success, revalidatePath will refresh the page and the button will turn into "Đã tham gia" or redirect
    } catch (err) {
      alert("Đã xảy ra lỗi khi tham gia thử thách.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isEnded || hasJoined ? "ghost" : "primary"}
      isDisabled={isEnded || hasJoined || isLoading}
      className="w-full font-bold rounded-xl shadow-sm"
      size="md"
      onPress={isUpcoming ? undefined : handleJoin}
    >
      {isLoading ? "Đang xử lý..." : isEnded ? "Đã đóng" : hasJoined ? "Đã tham gia" : isUpcoming ? "Đăng ký nhận thông báo" : "Tham gia ngay"}
    </Button>
  );
}
