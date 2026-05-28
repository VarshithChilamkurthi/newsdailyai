import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LinkedInPostEditor from "../components/LinkedInPostEditor";
import { fetchArticle, generatePost } from "../services/api";
import type { ArticleDetail, LinkedInPost } from "../types";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "thought_leadership", label: "Thought Leadership" },
] as const;

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const articleId = Number(id);

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId || Number.isNaN(articleId)) {
      setError("Invalid article ID");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchArticle(articleId);
        if (cancelled) return;
        setArticle(data.article);
        setPosts(data.linkedin_posts);
        setActivePostId(
          data.linkedin_posts.length > 0 ? data.linkedin_posts[0].id : null
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load article"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const newPost = await generatePost(articleId, tone);
      setPosts((prev) => {
        const exists = prev.some((p) => p.id === newPost.id);
        if (exists) return prev;
        return [newPost, ...prev];
      });
      setActivePostId(newPost.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate post");
    } finally {
      setGenerating(false);
    }
  };

  // When switching tones: select an existing post if present, otherwise generate on-demand.
  const handleToneSelect = async (nextTone: string) => {
    setTone(nextTone);
    const existing = posts.find((p) => p.tone === nextTone);
    if (existing) {
      setActivePostId(existing.id);
      return;
    }
    await handleGenerate();
  };

  const handlePostUpdated = (updated: LinkedInPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const activePost =
    posts.find((p) => p.id === activePostId) ?? posts[0] ?? null;

  const fullContent = article?.content_markdown?.trim() ?? "";
  const hasFullContent = fullContent.length > 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-red-600">{error}</p>
        <Link
          to="/"
          className="mt-4 inline-block text-indigo-600 hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  if (!article) return null;

  return (
    <main className="bg-[#f8f9fa] text-slate-900">
      <div className="flex h-screen flex-col overflow-hidden md:flex-row">
        {/* Left pane: article reader */}
        <section className="flex flex-1 flex-col bg-white md:flex-[0.6] md:border-r md:border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md md:px-10">
            <Link
              to="/"
              className="flex items-center gap-2 text-indigo-600 transition-transform duration-200 hover:-translate-x-1"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-sm font-semibold">Back to Feed</span>
            </Link>
            <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 font-mono text-[13px] font-medium uppercase tracking-wider text-orange-600">
              {article.source_name}
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-8 md:px-10 md:py-10">
            <div className="mx-auto max-w-3xl">
              <header className="mb-8">
                {article.published_date && (
                  <p className="mb-3 font-mono text-[13px] font-medium uppercase tracking-widest text-slate-500">
                    {new Date(article.published_date).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                )}
                <h1 className="mb-4 font-[Geist] text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
                  {article.title}
                </h1>
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm text-slate-500 hover:text-indigo-600 hover:underline"
                >
                  Originally from {article.source_name} ↗
                </a>
              </header>

              <article className="space-y-6 text-[18px] leading-relaxed text-slate-600">
                {hasFullContent ? (
                  <div className="whitespace-pre-wrap">{fullContent}</div>
                ) : article.summary ? (
                  <div className="space-y-4">
                    <p className="text-sm italic text-slate-500">
                      Full article text unavailable — showing summary.
                    </p>
                    <div className="whitespace-pre-wrap">{article.summary}</div>
                  </div>
                ) : (
                  <p className="text-slate-500">
                    No article content available yet. Run{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
                      python3 main.py
                    </code>{" "}
                    to extract full text.
                  </p>
                )}
              </article>
            </div>
          </div>
        </section>

        {/* Right pane: AI content engine */}
        <section className="flex flex-1 flex-col bg-slate-50 md:flex-[0.4]">
          <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-10">
            <div className="mx-auto space-y-8 md:max-w-[640px]">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                  <span className="material-symbols-outlined text-indigo-600">
                    psychology
                  </span>
                  Select Writing Tone
                </h3>
                <div className="flex flex-wrap gap-3">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => handleToneSelect(t.value)}
                      className={`tone-chip rounded-lg px-4 py-2.5 font-mono text-[13px] font-medium transition-all ${
                        tone === t.value
                          ? "border-2 border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-500 hover:text-indigo-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-indigo-600 py-4 text-xl font-bold text-white shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                >
                  <div className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="material-symbols-outlined">
                    auto_awesome
                  </span>
                  <span>
                    {generating ? "Generating..." : "Generate New Post"}
                  </span>
                </button>
                <p className="mt-3 text-center text-xs font-medium text-slate-500">
                  Powered by NewsDailyAI (Groq)
                </p>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {posts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {posts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePostId(p.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-mono font-medium transition ${
                        activePostId === p.id
                          ? "bg-indigo-50 text-indigo-700"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Post #{p.id} ({p.tone})
                    </button>
                  ))}
                </div>
              )}

              <LinkedInPostEditor
                articleId={articleId}
                post={activePost}
                onPostUpdated={handlePostUpdated}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
