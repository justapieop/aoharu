import type { SupabaseClient } from "@supabase/supabase-js";

export type ArticleListItem = {
  id: string;
  title: string;
  created_at: string;
  category: { id: number; name: string } | null;
  cover_image_url: string | null;
};

export type ArticleDetail = ArticleListItem & {
  content_html: string;
  author_name: string | null;
};

async function resolveCoverImageUrl(
  supabase: SupabaseClient,
  articleId: string,
  coverImageId: string | null
): Promise<string | null> {
  if (!coverImageId) return null;

  const { data: files, error } = await supabase.storage
    .from("assets")
    .list(`articles/${articleId}`, { limit: 200 });

  if (error || !files) return null;

  const match = files.find((file) => file.id === coverImageId);
  if (!match) return null;

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("assets")
    .getPublicUrl(`articles/${articleId}/${match.name}`);

  return publicUrl || null;
}

export async function fetchArticles(
  supabase: SupabaseClient,
  options: { categoryId?: number | null } = {}
): Promise<ArticleListItem[]> {
  let query = supabase
    .from("articles")
    .select(
      "id, title, created_at, cover_image_id, article_categories(id, name)"
    )
    .order("created_at", { ascending: false });

  if (options.categoryId != null) {
    query = query.eq("category_id", options.categoryId);
  }

  const { data: articles, error } = await query;

  if (error || !articles) {
    return [];
  }

  return Promise.all(
    articles.map(async (article) => {
      const rawCategory = (article as Record<string, unknown>).article_categories;
      const categoryRow = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
      const category =
        categoryRow && typeof categoryRow === "object"
          ? {
              id: Number((categoryRow as Record<string, unknown>).id),
              name: String((categoryRow as Record<string, unknown>).name ?? ""),
            }
          : null;

      const coverUrl = await resolveCoverImageUrl(
        supabase,
        article.id as string,
        (article.cover_image_id as string | null) ?? null
      );

      return {
        id: article.id as string,
        title: article.title as string,
        created_at: article.created_at as string,
        category,
        cover_image_url: coverUrl,
      };
    })
  );
}

export async function fetchArticleById(
  supabase: SupabaseClient,
  articleId: string
): Promise<ArticleDetail | null> {
  const { data: article, error } = await supabase
    .from("articles")
    .select(
      "id, title, content, created_at, cover_image_id, created_by, article_categories(id, name)"
    )
    .eq("id", articleId)
    .maybeSingle();

  if (error || !article) {
    return null;
  }

  const rawCategory = (article as Record<string, unknown>).article_categories;
  const categoryRow = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const category =
    categoryRow && typeof categoryRow === "object"
      ? {
          id: Number((categoryRow as Record<string, unknown>).id),
          name: String((categoryRow as Record<string, unknown>).name ?? ""),
        }
      : null;

  const coverUrl = await resolveCoverImageUrl(
    supabase,
    article.id as string,
    (article.cover_image_id as string | null) ?? null
  );

  let authorName: string | null = null;
  if (article.created_by) {
    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", article.created_by as string)
      .maybeSingle();

    authorName =
      (authorProfile?.display_name as string | undefined)?.trim() || null;
  }

  const rawContent = article.content as unknown;
  let contentHtml = "";
  if (typeof rawContent === "string") {
    contentHtml = rawContent;
  } else if (
    rawContent &&
    typeof rawContent === "object" &&
    "html" in (rawContent as Record<string, unknown>)
  ) {
    contentHtml = String((rawContent as Record<string, unknown>).html ?? "");
  }

  return {
    id: article.id as string,
    title: article.title as string,
    created_at: article.created_at as string,
    category,
    cover_image_url: coverUrl,
    content_html: contentHtml,
    author_name: authorName,
  };
}
