import { JSX } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { Surface } from "@heroui/react";
import { UploadEvidenceForm } from "./upload-evidence-form";

export default async function ActiveChallengePage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Fetch the user's active challenge entry
  const { data: activeEntries } = await supabase
    .from("challenge_entries")
    .select("id, challenge_id, created_at, challenges(*)")
    .eq("user_id", user.id)
    .eq("ended", false)
    .limit(1);

  if (!activeEntries || activeEntries.length === 0) {
    // If they do not have an active challenge, kick them back to the challenges list
    redirect("/challenges");
  }

  const activeChallenge: any = Array.isArray(activeEntries[0].challenges) 
    ? activeEntries[0].challenges[0] 
    : activeEntries[0].challenges;

  const entryId = activeEntries[0].id;

  // Check if user uploaded today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data: todayUploads } = await supabase
    .from("challenge_entry_uploads")
    .select("entry_id")
    .eq("entry_id", entryId)
    .gte("created_at", startOfToday.toISOString())
    .limit(1);

  const hasUploadedToday = Boolean(todayUploads && todayUploads.length > 0);

  // Fetch all uploads for the gallery
  const { data: allUploads } = await supabase
    .from("challenge_entry_uploads")
    .select("created_at, attachment_id")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });

  const challengeId = activeEntries[0].challenge_id;
  const { data: bucketFiles } = await supabase.storage
    .from("challenge_uploads")
    .list(`${user.id}/${challengeId}`);

  const attachmentToUrlMap = new Map();
  if (bucketFiles) {
    for (const file of bucketFiles) {
      if (file.id) {
        const publicUrl = supabase.storage
          .from("challenge_uploads")
          .getPublicUrl(`${user.id}/${challengeId}/${file.name}`).data.publicUrl;
        attachmentToUrlMap.set(file.id, publicUrl);
      }
    }
  }

  const startDate = new Date(activeEntries[0].created_at);
  startDate.setHours(0, 0, 0, 0);

  const days: { date: Date; uploadUrl: string | null }[] = [];
  for (let d = new Date(startDate); d <= startOfToday; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const upload = allUploads?.find((u) => {
      const uDate = new Date(u.created_at);
      return uDate >= currentDate && uDate < nextDate;
    });

    const uploadUrl = upload?.attachment_id ? attachmentToUrlMap.get(upload.attachment_id) || null : null;
    
    days.push({
      date: currentDate,
      uploadUrl,
    });
  }

  return (
    <Surface variant="default" className="flex flex-col md:flex-row h-screen w-full">
      <Sidebar />
      <Surface variant="default" className="flex-1 h-full overflow-y-auto px-3 py-4 pb-20 sm:pb-4 md:p-6 bg-default-50/50">
        <Surface variant="transparent" className="w-full max-w-3xl mx-auto flex flex-col gap-6">
          
          <div className="rounded-3xl bg-linear-to-br from-accent/20 via-emerald-500/5 to-transparent p-6 md:p-10 flex flex-col items-center justify-center text-center border border-accent/20 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm mb-4 border border-white/40">
                <span className="text-3xl">🎯</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Đang thực hiện thử thách
              </h1>
              <p className="mt-3 text-base md:text-lg text-default-600 font-medium max-w-lg mx-auto leading-relaxed">
                Hoàn thành nhiệm vụ để nhận điểm thưởng xanh!
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-default-200/60 shadow-sm p-5 md:p-8 flex flex-col items-center text-center gap-4">
            <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent-700 border border-accent-soft-hover">
              Thử thách hiện tại
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {activeChallenge?.name || "Đang tải..."}
            </h2>
            <div className="bg-orange-50 text-orange-600 font-bold px-4 py-2 rounded-xl border border-orange-100 flex items-center gap-2">
              <span>Điểm thưởng:</span>
              <span className="text-xl">+{activeChallenge?.points || 0}</span>
            </div>
            <p className="text-default-500 mt-2">
              Hãy chứng minh bạn đã hoàn thành thử thách bằng cách đăng bài cập nhật hoặc check-in!
            </p>

            <UploadEvidenceForm entryId={entryId} hasUploadedToday={hasUploadedToday} />
          </div>

          <div className="bg-white rounded-3xl border border-default-200/60 shadow-sm p-5 md:p-8 flex flex-col items-center gap-4">
            <h3 className="font-bold text-xl text-foreground w-full text-left">Nhật ký Thử thách</h3>
            <p className="text-sm text-default-500 w-full text-left">Tiến độ từ ngày tham gia đến hiện tại</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full mt-2">
              {days.map((day, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-default-500">
                    Ngày {i + 1} ({day.date.toLocaleDateString('vi-VN')})
                  </span>
                  <div className="aspect-square rounded-2xl overflow-hidden bg-default-100 border border-default-200 relative flex items-center justify-center shadow-sm">
                    {day.uploadUrl ? (
                      <img src={day.uploadUrl} alt={`Ngày ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-default-400 flex flex-col items-center">
                        <span className="text-2xl">⏳</span>
                        <span className="text-[10px] mt-1 font-medium uppercase tracking-widest">Trống</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </Surface>
      </Surface>
    </Surface>
  );
}