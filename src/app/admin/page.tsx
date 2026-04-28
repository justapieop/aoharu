import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Link, Surface } from "@heroui/react";
import { MapPinIcon, ShieldCheckIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
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
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Quản lý bài viết</h2>
              <p className="mt-1 text-sm text-default-500">Thêm, chỉnh sửa hoặc xóa bài viết để quản lý nội dung cộng đồng.</p>
              <Link
                href="/admin/articles"
                className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground no-underline hover:opacity-90"
              >
                Đi đến quản lý bài viết
              </Link>
            </div>
          </div>
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
                className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground no-underline hover:opacity-90"
              >
                Đi đến quản lý marker
              </Link>
            </div>
          </div>
        </Surface>

        <Surface variant="secondary" className="mt-4 rounded-xl border border-default-200 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2 text-orange-500">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Quản lý thử thách</h2>
              <p className="mt-1 text-sm text-default-500">
                Thêm, sửa, xóa các thử thách để khuyến khích cộng đồng tham gia hoạt động bảo vệ môi trường.
              </p>
              <Link
                href="/admin/challenges"
                className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground no-underline hover:opacity-90"
              >
                Đi đến quản lý thử thách
              </Link>
            </div>
          </div>
        </Surface>
      </main>
    </Surface>
  );
}