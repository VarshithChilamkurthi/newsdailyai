import { useEffect, useState } from "react";
import type { LinkedInPost } from "../types";
import { savePost } from "../services/api";

interface LinkedInPostEditorProps {
  articleId: number;
  post: LinkedInPost | null;
  onPostUpdated: (post: LinkedInPost) => void;
}

const MAX_CHARS = 1300;

export default function LinkedInPostEditor({
  articleId,
  post,
  onPostUpdated,
}: LinkedInPostEditorProps) {
  const [editableText, setEditableText] = useState(post?.post_text ?? "");
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditableText(post?.post_text ?? "");
  }, [post]);

  if (!post) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        Generate a post first
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await savePost(articleId, post.id, editableText);
      onPostUpdated(result.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const charCount = editableText.length;
  const overLimit = charCount > MAX_CHARS;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-500">
          Tone: {post.tone}
          {post.is_edited && (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-800">
              Edited
            </span>
          )}
        </span>
        <span
          className={`text-sm font-mono ${
            overLimit ? "text-red-600" : "text-slate-500"
          }`}
        >
          {charCount} / {MAX_CHARS}
        </span>
      </div>

      <textarea
        value={editableText}
        onChange={(e) => setEditableText(e.target.value)}
        rows={14}
        className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Copy to Clipboard
        </button>
        {isCopied && (
          <span className="flex items-center text-sm font-medium text-green-600">
            Copied!
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
