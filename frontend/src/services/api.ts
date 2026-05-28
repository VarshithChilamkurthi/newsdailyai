import type {
  ArticleDetailResponse,
  ArticlesResponse,
  LinkedInPost,
} from "../types";

const BASE_URL = "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      (error as { detail?: string }).detail ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function fetchArticles(
  page: number,
  limit: number,
  search?: string
): Promise<{ articles: ArticlesResponse["articles"]; total: number }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const data = await handleResponse<ArticlesResponse>(
    await fetch(`${BASE_URL}/api/articles?${params}`)
  );
  return { articles: data.articles, total: data.total };
}

export async function fetchArticle(
  id: number
): Promise<ArticleDetailResponse> {
  return handleResponse<ArticleDetailResponse>(
    await fetch(`${BASE_URL}/api/articles/${id}`)
  );
}

export async function generatePost(
  articleId: number,
  tone: string
): Promise<LinkedInPost> {
  return handleResponse<LinkedInPost>(
    await fetch(`${BASE_URL}/api/articles/${articleId}/generate-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tone }),
    })
  );
}

export async function savePost(
  articleId: number,
  postId: number,
  postText: string
): Promise<{ message: string; post: LinkedInPost }> {
  return handleResponse<{ message: string; post: LinkedInPost }>(
    await fetch(`${BASE_URL}/api/articles/${articleId}/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_text: postText }),
    })
  );
}
