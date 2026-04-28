import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Link, Surface } from "@heroui/react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { AdminNavbar } from "@/components/admin-navbar";
import { CategoryManager } from "@/components/category-manager";
import { ArticleCreateForm } from "@/components/article-create-form";

export default async function ArticleManagePage() {
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

  const { data: categories, error: categoriesError } = await supabase
    .from("article_categories")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (categoriesError) {
    console.error("Failed to load article categories:", categoriesError.message);
  }

  return (
    <Surface variant="default" className="min-h-screen w-full">
      <AdminNavbar activePage="articles" subtitle="Quản trị viên" title="Quản lý bài viết" />

      <main className="mx-auto w-full max-w-7xl p-6">
        <Surface variant="secondary" className="rounded-xl border border-default-200 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Quản lý bài viết</h1>
              <p className="mt-2 text-sm text-default-500">
                Khu vực này dùng để thêm, chỉnh sửa hoặc xóa các bài viết cộng đồng.
              </p>
            </div>
          </div>
        </Surface>

        <Surface variant="secondary" className="mt-4 rounded-xl border border-default-200 p-6">
          <CategoryManager initialCategories={categories ?? []} />
        </Surface>

        <Surface variant="secondary" className="mt-4 rounded-xl border border-default-200 p-6">
          <ArticleCreateForm categories={categories ?? []} />
        </Surface>

        <div className="mt-4">
          <Link
            href="/admin"
            className="inline-flex rounded-lg border border-default-300 px-4 py-2 text-sm font-semibold text-default-700 no-underline hover:bg-default-100"
          >
            Quay lại trang quản trị
          </Link>
        </div>
      </main>
    </Surface>
  );
}