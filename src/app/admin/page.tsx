import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Surface } from "@heroui/react";
import { MapPinIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { AdminNavbar } from "@/components/admin-navbar";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.admin !== true) {
    redirect("/community");
  }

  return (
    <Surface variant="default" className="min-h-screen w-full">
      <AdminNavbar activePage="dashboard" subtitle="Quản trị viên" title="Trang quản trị" />

      <main className="mx-auto w-full max-w-7xl p-6">
        <Surface variant="secondary" className="rounded-xl border border-default-200 p-6">
          <h1 className="text-xl font-semibold">Trang quản trị</h1>
          <p className="mt-2 text-sm text-default-500">Khu vực này chỉ dành cho tài khoản có quyền quản trị.</p>
        </Surface>

        <Surface variant="secondary" className="mt-4 rounded-xl border border-default-200 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-accent/10 p-2 text-accent">
              <MapPinIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Quản lý điểm đánh dấu bản đồ</h2>
              <p className="mt-1 text-sm text-default-500">
                Truy cập khu vực quản lý marker để thêm, chỉnh sửa hoặc xóa các điểm trên bản đồ.
              </p>
              <Link
                href="/admin/pins"
                className="mt-4 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              >
                Đi đến quản lý marker
              </Link>
            </div>
          </div>
        </Surface>
      </main>
    </Surface>
  );
}