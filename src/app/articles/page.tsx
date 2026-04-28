import { JSX } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { Surface } from "@heroui/react";
import { DocumentTextIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { fetchArticles } from "./data";

interface ArticlesPageProps {
  searchParams: Promise<{ category?: string | string[] }>;
}

export default async function ArticlesPage({
  searchParams,
}: ArticlesPageProps): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const resolvedSearchParams = await searchParams;
  const rawCategory = resolvedSearchParams.category;
  const categoryParam = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const parsedCategoryId =
    categoryParam && /^\d+$/.test(categoryParam) ? Number(categoryParam) : null;

  const [{ data: categoriesData }, articles] = await Promise.all([
    supabase
      .from("article_categories")
      .select("id, name")
      .order("name", { ascending: true }),
    fetchArticles(supabase, { categoryId: parsedCategoryId }),
  ]);

  const categories = categoriesData ?? [];
  const activeCategoryId =
    parsedCategoryId != null && categories.some((c) => c.id === parsedCategoryId)
      ? parsedCategoryId
      : null;

  return (
    <Surface variant="default" className="flex flex-col md:flex-row h-screen w-full">
      <Sidebar />
      <Surface
        variant="default"
        className="flex-1 h-full overflow-y-auto px-3 py-4 pb-20 sm:pb-4 md:p-6 bg-default-50/50"
      >
        <Surface
          variant="transparent"
          className="w-full max-w-5xl mx-auto flex flex-col gap-6"
        >
          <div className="rounded-3xl bg-linear-to-br from-accent-soft-hover via-emerald-500/5 to-transparent p-6 md:p-10 flex flex-col items-center justify-center text-center border border-accent-soft-hover relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm mb-4 border border-white/40">
                <DocumentTextIcon className="w-8 h-8 text-accent-700" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Bài viết Cộng đồng
              </h1>
              <p className="mt-3 text-base md:text-lg text-default-600 font-medium max-w-lg mx-auto leading-relaxed">
                Khám phá những bài viết về môi trường và lối sống xanh.
              </p>
            </div>
          </div>

          {categories.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-default-500">
                Danh mục:
              </span>
              <Link
                href="/articles"
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium no-underline transition-colors ${
                  activeCategoryId == null
                    ? "border-accent-soft-hover bg-accent text-white"
                    : "border-default-200 bg-white text-default-700 hover:border-accent-soft-hover hover:text-accent-700"
                }`}
              >
                Tất cả
              </Link>
              {categories.map((category) => {
                const isActive = activeCategoryId === category.id;
                return (
                  <Link
                    key={category.id}
                    href={`/articles?category=${category.id}`}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium no-underline transition-colors ${
                      isActive
                        ? "border-accent-soft-hover bg-accent text-white"
                        : "border-default-200 bg-white text-default-700 hover:border-accent-soft-hover hover:text-accent-700"
                    }`}
                  >
                    {category.name}
                  </Link>
                );
              })}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {articles.length === 0 ? (
              <div className="col-span-full py-12 text-center flex flex-col items-center justify-center text-default-500 bg-white rounded-3xl border border-default-200/60 shadow-sm">
                <DocumentTextIcon className="w-12 h-12 text-default-300 mb-3" />
                <p className="font-medium">
                  {activeCategoryId != null
                    ? "Không có bài viết nào trong danh mục này."
                    : "Chưa có bài viết nào."}
                </p>
                <p className="text-sm mt-1">
                  {activeCategoryId != null
                    ? "Hãy thử chọn danh mục khác."
                    : "Hãy quay lại sau nhé!"}
                </p>
              </div>
            ) : (
              articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-default-200/60 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md no-underline"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-default-100">
                    {article.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.cover_image_url}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-default-300">
                        <DocumentTextIcon className="h-12 w-12" />
                      </div>
                    )}
                    {article.category ? (
                      <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-accent-soft-hover bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-accent-700 backdrop-blur-md">
                        {article.category.name}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
                    <h3 className="text-lg font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent-700 transition-colors">
                      {article.title}
                    </h3>
                    <div className="mt-auto flex items-center gap-1.5 text-xs text-default-500">
                      <CalendarDaysIcon className="h-3.5 w-3.5" />
                      <span>
                        {new Date(article.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Surface>
      </Surface>
    </Surface>
  );
}
