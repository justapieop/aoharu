import { JSX } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { Surface } from "@heroui/react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { fetchArticleById } from "../data";

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  const article = await fetchArticleById(supabase, id);

  if (!article) {
    notFound();
  }

  const formattedDate = new Date(article.created_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Surface variant="default" className="flex flex-col md:flex-row h-screen w-full">
      <Sidebar />
      <Surface
        variant="default"
        className="flex-1 h-full overflow-y-auto px-3 py-4 pb-20 sm:pb-4 md:p-6 bg-default-50/50"
      >
        <Surface
          variant="transparent"
          className="w-full max-w-3xl mx-auto flex flex-col gap-6"
        >
          <div>
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 rounded-full border border-default-200 bg-white px-3 py-1.5 text-sm font-medium text-default-700 no-underline shadow-sm transition-colors hover:bg-default-50"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Quay lại danh sách
            </Link>
          </div>

          <article className="overflow-hidden rounded-3xl border border-default-200/60 bg-white shadow-sm">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-default-100">
              {article.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.cover_image_url}
                  alt={article.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-default-300">
                  <DocumentTextIcon className="h-16 w-16" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 px-5 py-6 md:px-8 md:py-8">
              <div className="flex flex-wrap items-center gap-2">
                {article.category ? (
                  <span className="inline-flex items-center rounded-full border border-accent-soft-hover bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
                    {article.category.name}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 text-xs text-default-500">
                  <CalendarDaysIcon className="h-3.5 w-3.5" />
                  {formattedDate}
                </span>
                {article.author_name ? (
                  <span className="inline-flex items-center gap-1 text-xs text-default-500">
                    <UserIcon className="h-3.5 w-3.5" />
                    {article.author_name}
                  </span>
                ) : null}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                {article.title}
              </h1>

              <div
                className="prose prose-base max-w-none text-foreground [&_img]:rounded-xl [&_img]:max-w-full [&_img]:h-auto [&_video]:rounded-xl [&_video]:max-w-full [&_video]:h-auto [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_p]:my-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1"
                dangerouslySetInnerHTML={{ __html: article.content_html }}
              />
            </div>
          </article>
        </Surface>
      </Surface>
    </Surface>
  );
}
