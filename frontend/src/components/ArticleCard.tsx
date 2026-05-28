import { Link } from "react-router-dom";
import type { Article } from "../types";

interface ArticleCardProps {
  article: Article;
}

function getSourceBadge(article: Article) {
  const source = article.source_name.toLowerCase();
  if (source.includes("hacker")) {
    return {
      label: "HN",
      className:
        "bg-[#FF6600] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono",
    };
  }
  if (source.includes("dev.to") || source.includes("devto")) {
    return {
      label: "Dev.to",
      className:
        "bg-[#0A0A0A] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono",
    };
  }
  return {
    label: article.source_name,
    className:
      "bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono",
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown date";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const badge = getSourceBadge(article);

  return (
    <Link
      to={`/article/${article.id}`}
      className="article-card flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg active:scale-[0.98]"
    >
      <div className="mb-2 flex items-start justify-between">
        <span className={badge.className}>{badge.label}</span>
        <span className="text-xs font-medium text-slate-500">
          {formatDate(article.published_date)}
        </span>
      </div>

      <h2 className="mb-2 line-clamp-2 text-base font-semibold text-slate-900">
        {article.title}
      </h2>

      {article.summary && (
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
          {article.summary}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between">
        <div className="flex gap-4 text-slate-500">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">
              chat_bubble
            </span>
            <span className="text-xs font-mono font-medium">—</span>
          </div>
        </div>
        <span className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
          Analyze
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </span>
      </div>
    </Link>
  );
}
