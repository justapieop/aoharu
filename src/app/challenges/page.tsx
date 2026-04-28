import { JSX } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { Surface, Card } from "@heroui/react";
import { FireIcon, CalendarDaysIcon, GiftIcon } from "@heroicons/react/24/outline";
import { JoinButton } from "./join-button";

export default async function ChallengePage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Fetch all upcoming/active challenges
  const { data: challenges } = await supabase
    .from("challenges")
    .select("*")
    .order("ends_at", { ascending: true });

  // Fetch user's joined challenges
  const { data: entries } = await supabase
    .from("challenge_entries")
    .select("challenge_id, ended")
    .eq("user_id", user.id);

  // If the user has an active, ongoing challenge, redirect them
  const hasActiveChallenge = entries?.some((e) => e.ended === false);
  if (hasActiveChallenge) {
    redirect("/challenges/active"); // Placeholder redirect destination
  }

  const joinedChallengeIds = new Set(entries?.map((e) => e.challenge_id) || []);

  const now = new Date();

  return (
    <Surface variant="default" className="flex flex-col md:flex-row h-screen w-full">
      <Sidebar />
      <Surface variant="default" className="flex-1 h-full overflow-y-auto px-3 py-4 pb-20 sm:pb-4 md:p-6 bg-default-50/50">
        <Surface variant="transparent" className="w-full max-w-4xl mx-auto flex flex-col gap-6">
          
          {/* Header Banner */}
          <div className="rounded-3xl bg-linear-to-br from-accent-soft-hover via-emerald-500/5 to-transparent p-6 md:p-10 flex flex-col items-center justify-center text-center border border-accent-soft-hover relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm mb-4 border border-white/40">
                <FireIcon className="w-8 h-8 text-orange-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Thử thách Cộng đồng</h1>
              <p className="mt-3 text-base md:text-lg text-default-600 font-medium max-w-lg mx-auto leading-relaxed">
                Tham gia các thử thách bảo vệ môi trường, lan tỏa lối sống xanh và tích lũy điểm thưởng!
              </p>
            </div>
          </div>

          {/* Challenges List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-2">
            {!challenges || challenges.length === 0 ? (
              <div className="col-span-full py-12 text-center flex flex-col items-center justify-center text-default-500 bg-white rounded-3xl border border-default-200/60 shadow-sm">
                <FireIcon className="w-12 h-12 text-default-300 mb-3" />
                <p className="font-medium">Hiện tại chưa có thử thách nào đang diễn ra.</p>
                <p className="text-sm mt-1">Hãy quay lại sau nhé!</p>
              </div>
            ) : (
              challenges.map((challenge) => {
                const endsAt = new Date(challenge.ends_at);
                const isEnded = endsAt < now;
                const startsAt = new Date(challenge.started_at);
                const isUpcoming = startsAt > now;
                const hasJoined = joinedChallengeIds.has(challenge.id);

                return (
                  <Card key={challenge.id} className="w-full border border-default-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl bg-white overflow-hidden flex flex-col h-full">
                    <Card.Header className="flex flex-row items-start justify-between gap-3 px-4 pt-5 pb-2 md:px-6 md:pt-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {isEnded ? (
                            <span className="inline-flex items-center rounded-full bg-default-100 px-2.5 py-0.5 text-xs font-semibold text-default-600 border border-default-200">
                              Đã kết thúc
                            </span>
                          ) : isUpcoming ? (
                            <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning-700 border border-warning-soft-hover">
                              Sắp diễn ra
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent-700 border border-accent-soft-hover">
                              Đang diễn ra
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-xl text-foreground leading-tight">{challenge.name}</h3>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-orange-50 rounded-2xl p-2 min-w-16 border border-orange-100 shrink-0">
                        <GiftIcon className="w-5 h-5 text-orange-500 mb-0.5" />
                        <span className="font-black text-orange-600 text-sm">{challenge.points}</span>
                      </div>
                    </Card.Header>
                    
                    <Card.Content className="px-4 py-3 md:px-6 flex-1">
                      {/* Note: since there is no description in schema right now, we omit it. Or we can just show dates nicely */}
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center gap-2 text-sm text-default-600 bg-default-50/50 p-2.5 rounded-xl border border-default-100">
                          <CalendarDaysIcon className="w-4 h-4 text-default-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[11px] text-default-400 font-medium uppercase tracking-wider">Thời gian</span>
                            <span className="font-medium">
                              {startsAt.toLocaleDateString("vi-VN")} - {endsAt.toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card.Content>
                    
                    <Card.Footer className="px-4 py-4 md:px-6 bg-default-50/30 border-t border-default-100 mt-auto">
                      <JoinButton 
                        challengeId={challenge.id} 
                        isEnded={isEnded} 
                        hasJoined={hasJoined} 
                        isUpcoming={isUpcoming} 
                      />
                    </Card.Footer>
                  </Card>
                );
              })
            )}
          </div>
        </Surface>
      </Surface>
    </Surface>
  );
}