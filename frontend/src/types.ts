export interface Article {
  id: number;
  title: string;
  source_url: string;
  source_name: string;
  summary: string;
  published_date: string | null;
}

export interface LinkedInPost {
  id: number;
  post_text: string;
  copy_ready: string;
  char_count: number;
  tone: string;
  is_edited: boolean;
  generated_at: string;
}

export interface ArticlesResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
}

export interface ArticleDetail extends Article {
  content_markdown: string;
  tags?: string;
}

export interface ArticleDetailResponse {
  article: ArticleDetail;
  linkedin_posts: LinkedInPost[];
}
