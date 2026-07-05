"use client";

import { useCallback, useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Trash2, Send, MessageSquare } from "lucide-react";
import { fmtDate } from "@/utils/designUtils";

type Comment = {
  id: string;
  name: string;
  comment: string;
  createdAt: string;
};

const VISITOR_KEY = "vaamki-visitor-id";

function getVisitorId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export default function ArticleEngagement({
  postId,
  isMasterAdmin,
}: {
  postId: string;
  isMasterAdmin: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/blogs/${postId}/comments`);
      const data = await res.json();
      if (res.ok) setComments(data.comments || []);
    } catch {
      /* ignore */
    } finally {
      setCommentsLoading(false);
    }
  }, [postId]);

  const loadReactions = useCallback(async () => {
    const visitorId = getVisitorId();
    try {
      const res = await fetch(`/api/blogs/${postId}/reactions?visitorId=${encodeURIComponent(visitorId)}`);
      const data = await res.json();
      if (res.ok) {
        setLikeCount(data.likeCount ?? 0);
        setDislikeCount(data.dislikeCount ?? 0);
        setUserReaction(data.userReaction ?? null);
      }
    } catch {
      /* ignore */
    }
  }, [postId]);

  useEffect(() => {
    void loadComments();
    void loadReactions();
  }, [loadComments, loadReactions]);

  const handleReaction = async (reaction: "like" | "dislike") => {
    if (reactionLoading) return;
    setReactionLoading(true);
    const visitorId = getVisitorId();
    const nextReaction = userReaction === reaction ? null : reaction;
    try {
      const res = await fetch(`/api/blogs/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, reaction: nextReaction }),
      });
      const data = await res.json();
      if (res.ok) {
        setLikeCount(data.likeCount ?? 0);
        setDislikeCount(data.dislikeCount ?? 0);
        setUserReaction(data.userReaction ?? null);
      }
    } catch {
      /* ignore */
    } finally {
      setReactionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/blogs/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "टिप्पणी सबमिट नहीं हो सकी।");
        return;
      }
      setComments((prev) => [data.comment, ...prev]);
      setForm({ name: form.name, email: form.email, comment: "" });
      setFormSuccess("आपकी टिप्पणी सफलतापूर्वक जोड़ी गई।");
      setTimeout(() => setFormSuccess(""), 4000);
    } catch {
      setFormError("नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deletingId) return;
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/blogs/${postId}/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const data = await res.json();
        alert(data.error || "टिप्पणी हटाने में त्रुटि।");
      }
    } catch {
      alert("नेटवर्क त्रुटि");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="article-engagement article-no-print notranslate mt-6 space-y-6 border-t border-[var(--line)] pt-6">
      {/* Reactions */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-serif text-lg font-bold text-[var(--headline)]">क्या यह लेख उपयोगी था?</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleReaction("like")}
            disabled={reactionLoading}
            className={`article-reaction-btn ${userReaction === "like" ? "article-reaction-btn--active-like" : ""}`}
            aria-label="पसंद"
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{likeCount}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleReaction("dislike")}
            disabled={reactionLoading}
            className={`article-reaction-btn ${userReaction === "dislike" ? "article-reaction-btn--active-dislike" : ""}`}
            aria-label="नापसंद"
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{dislikeCount}</span>
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[var(--primary)]" />
          <h3 className="font-serif text-xl font-bold text-[var(--headline)]">टिप्पणियाँ</h3>
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">
            {comments.length}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mb-5 space-y-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">अपनी राय साझा करें</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="नाम *"
              required
              maxLength={120}
              className="article-engagement-input"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="ईमेल *"
              required
              maxLength={191}
              className="article-engagement-input"
            />
          </div>
          <textarea
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="अपनी टिप्पणी लिखें..."
            required
            maxLength={5000}
            rows={4}
            className="article-engagement-input min-h-[100px] resize-y"
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          {formSuccess && <p className="text-sm text-green-600">{formSuccess}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? "भेज रहे हैं..." : "टिप्पणी भेजें"}
          </button>
        </form>

        <div className="article-comments-scroll max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {commentsLoading ? (
            <p className="text-sm text-[var(--muted)]">टिप्पणियाँ लोड हो रही हैं...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-[var(--muted)] italic">अभी कोई टिप्पणी नहीं। पहले टिप्पणी करने वाले बनें!</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="group rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/40"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--headline)]">{c.name}</p>
                    <p className="text-xs text-[var(--muted)]">{fmtDate(c.createdAt)}</p>
                  </div>
                  {isMasterAdmin && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteComment(c.id)}
                      disabled={deletingId === c.id}
                      className="shrink-0 rounded-md border border-transparent p-1.5 text-[var(--muted)] opacity-70 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-40"
                      title="टिप्पणी हटाएं"
                      aria-label="टिप्पणी हटाएं"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">{c.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
