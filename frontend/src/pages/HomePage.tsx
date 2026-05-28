import { useCallback, useEffect, useState } from "react";
import ArticleCard from "../components/ArticleCard";
import { fetchArticles } from "../services/api";
import type { Article } from "../types";

const LIMIT = 18;

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticles(page, LIMIT, searchQuery || undefined);
      setArticles(data.articles);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load articles");
      setArticles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900">
      {/* Top header with search and filters */}
      <header className="sticky top-0 z-20 bg-[#f8f9fa]/80 px-4 py-6 backdrop-blur-xl md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Trending Articles
            </h1>
            <form
              onSubmit={handleSearch}
              className="relative w-full md:w-96"
            >
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search insights..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </form>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            <button className="whitespace-nowrap rounded-full bg-indigo-600 px-6 py-2 font-mono text-[13px] font-medium text-white shadow-sm">
              All Sources
            </button>
            <button className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-6 py-2 font-mono text-[13px] font-medium text-slate-600 hover:border-indigo-500 hover:text-indigo-600">
              Hacker News
            </button>
            <button className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-6 py-2 font-mono text-[13px] font-medium text-slate-600 hover:border-indigo-500 hover:text-indigo-600">
              Dev.to
            </button>
            <button className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-6 py-2 font-mono text-[13px] font-medium text-slate-600 hover:border-indigo-500 hover:text-indigo-600">
              Product Hunt
            </button>
            <div className="ml-auto hidden items-center gap-2 font-mono text-[13px] font-medium text-slate-500 md:flex">
              <span className="material-symbols-outlined text-[18px]">
                sort
              </span>
              <span>Latest First</span>
            </div>
          </div>
        </div>
      </header>

      {/* Feed */}
      <section className="px-4 pb-20 md:px-10">
        <div className="mx-auto max-w-6xl">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-center text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-indigo-200" />
              Loading...
            </div>
          ) : articles.length === 0 ? (
            <p className="py-20 text-center text-slate-500">No articles found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {!loading && total > 0 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="flex h-10 items-center px-3 font-mono text-[13px] font-medium text-slate-600">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
