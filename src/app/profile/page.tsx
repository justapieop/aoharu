import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { Card, Avatar, Separator, Surface } from "@heroui/react";
import { EditableAvatar } from "@/components/editable-avatar";

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const displayName = user.user_metadata?.display_name || user.email;
  const { data: profile } = await supabase
    .from("profiles")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.admin === true;

  return (
    <Surface variant="default" className="flex flex-col md:flex-row h-screen w-full">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto p-6 text-foreground flex justify-center items-start pt-12">
        <Card className="w-full max-w-2xl p-6">
          <Card.Header className="flex flex-row gap-4 items-center mb-4">
            <EditableAvatar userId={user.id} fallback={displayName?.charAt(0).toUpperCase() || "U"} />
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Card.Title className="text-2xl font-bold">{displayName}</Card.Title>
                {isAdmin && (
                  <span className="shrink-0 rounded-full bg-accent/10 border border-default-200 px-2.5 py-1 text-[11px] font-semibold text-accent">
                    Quản trị viên
                  </span>
                )}
              </div>
              <Card.Description className="text-default-500">{user.email}</Card.Description>
            </div>
          </Card.Header>
          
          <Card.Content className="flex flex-col gap-4">
            <Card variant="secondary" className="shadow-none">
              <Card.Header>
                <Card.Title className="text-lg font-semibold">Thông tin tài khoản</Card.Title>
              </Card.Header>
              <Card.Content>
                <dl className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <dt className="text-default-500">ID Người dùng</dt>
                    <dd className="font-mono text-sm truncate max-w-50">{user.id}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <dt className="text-default-500">Ngày đăng ký</dt>
                    <dd>{new Date(user.created_at).toLocaleDateString("vi-VN")}</dd>
                  </div>
                </dl>
              </Card.Content>
            </Card>
          </Card.Content>
        </Card>
      </main>
    </Surface>
  );
}
