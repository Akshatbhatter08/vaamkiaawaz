"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getCategoryClass } from "@/utils/designUtils";
import { focusToObjectPosition, resolveImageFocus } from "@/lib/imageCrop";
import { getVisitorId } from "@/lib/feedAffinity";
import { getRecentReadIds } from "@/lib/recentReads";
import type { BlogPostCard } from "@/lib/blogPostCards";

export type MobileNavActivityPanel = "main" | "activity" | "views" | "likes" | "comments";

type ActivityPostListProps = {
  emptyMessage: string;
  loadPosts: () => Promise<BlogPostCard[]>;
  getPreviewImage: (post: BlogPostCard) => string | null | undefined;
  getPostTimeLabel: (post: BlogPostCard) => string;
  getPostClicks: (post: BlogPostCard) => number;
  onPostClick: (postId: string) => void;
  onClose: () => void;
};

function ActivityPostList({
  emptyMessage,
  loadPosts,
  getPreviewImage,
  getPostTimeLabel,
  getPostClicks,
  onPostClick,
  onClose,
}: ActivityPostListProps) {
  const [posts, setPosts] = useState<BlogPostCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadPosts()
      .then((next) => {
        if (!cancelled) setPosts(next);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadPosts]);

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">लोड हो रहा है...</p>;
  }
  if (posts.length === 0) {
    return <p className="text-sm text-[var(--muted)] italic">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Link
          key={`activity-${post.id}`}
          href={`/post/${post.id}`}
          onClick={() => {
            onPostClick(post.id);
            onClose();
          }}
          className="home-mobile__row-card block overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)]"
        >
          <span className="home-mobile__row-media">
            {getPreviewImage(post) && (
              <img
                src={getPreviewImage(post)!}
                alt={post.title}
                style={{ objectPosition: focusToObjectPosition(resolveImageFocus(post, "card")) }}
              />
            )}
          </span>
          <span className="home-mobile__row-body">
            <span className={`cat-pill ${getCategoryClass(post.category)}`}>{post.category}</span>
            <span className="home-mobile__row-title">{post.title}</span>
            <span className="home-mobile__row-meta">
              {post.author} · {getPostTimeLabel(post)} · {getPostClicks(post)} क्लिक
            </span>
            <span className="home-mobile__read-more">पूरा लेख पढ़ें →</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

type MobileNavActivityPanelsProps = {
  panel: MobileNavActivityPanel;
  onBack: () => void;
  onNavigate: (panel: MobileNavActivityPanel) => void;
  onClose: () => void;
  getPreviewImage: (post: BlogPostCard) => string | null | undefined;
  getPostTimeLabel: (post: BlogPostCard) => string;
  getPostClicks: (post: BlogPostCard) => number;
  onPostClick: (postId: string) => void;
};

export function MobileNavActivityEntry({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
    >
      <span>आपकी गतिविधि</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
    </button>
  );
}

export function MobileNavActivityPanels({
  panel,
  onBack,
  onNavigate,
  onClose,
  getPreviewImage,
  getPostTimeLabel,
  getPostClicks,
  onPostClick,
}: MobileNavActivityPanelsProps) {
  const loadViewPosts = useCallback(async () => {
    const ids = getRecentReadIds();
    if (ids.length === 0) return [];
    const res = await fetch(`/api/blogs/by-ids?ids=${encodeURIComponent(ids.join(","))}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { posts?: BlogPostCard[] };
    return Array.isArray(data.posts) ? data.posts : [];
  }, []);

  const loadLikedPosts = useCallback(async () => {
    const visitorId = getVisitorId();
    if (!visitorId) return [];
    const res = await fetch(
      `/api/my-activity/likes?visitorId=${encodeURIComponent(visitorId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { posts?: BlogPostCard[] };
    return Array.isArray(data.posts) ? data.posts : [];
  }, []);

  const loadCommentedPosts = useCallback(async () => {
    const visitorId = getVisitorId();
    if (!visitorId) return [];
    const res = await fetch(
      `/api/my-activity/comments?visitorId=${encodeURIComponent(visitorId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { posts?: BlogPostCard[] };
    return Array.isArray(data.posts) ? data.posts : [];
  }, []);

  if (panel === "main") return null;

  const listTitle =
    panel === "views" ? "व्यू" : panel === "likes" ? "पसंद" : panel === "comments" ? "टिप्पणियाँ" : "आपकी गतिविधि";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-[var(--line)] p-1.5 text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          aria-label="वापस"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-[var(--headline)]">{listTitle}</p>
      </div>

      {panel === "activity" ? (
        <div className="space-y-2">
          {(
            [
              { key: "views" as const, label: "व्यू" },
              { key: "likes" as const, label: "पसंद" },
              { key: "comments" as const, label: "टिप्पणियाँ" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className="flex w-full items-center justify-between rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            </button>
          ))}
        </div>
      ) : panel === "views" ? (
        <ActivityPostList
          emptyMessage="आपने अभी तक कोई लेख नहीं पढ़ा है।"
          loadPosts={loadViewPosts}
          getPreviewImage={getPreviewImage}
          getPostTimeLabel={getPostTimeLabel}
          getPostClicks={getPostClicks}
          onPostClick={onPostClick}
          onClose={onClose}
        />
      ) : panel === "likes" ? (
        <ActivityPostList
          emptyMessage="आपने अभी तक कोई लेख पसंद नहीं किया है।"
          loadPosts={loadLikedPosts}
          getPreviewImage={getPreviewImage}
          getPostTimeLabel={getPostTimeLabel}
          getPostClicks={getPostClicks}
          onPostClick={onPostClick}
          onClose={onClose}
        />
      ) : (
        <ActivityPostList
          emptyMessage="आपने अभी तक कोई टिप्पणी नहीं की है।"
          loadPosts={loadCommentedPosts}
          getPreviewImage={getPreviewImage}
          getPostTimeLabel={getPostTimeLabel}
          getPostClicks={getPostClicks}
          onPostClick={onPostClick}
          onClose={onClose}
        />
      )}
    </div>
  );
}
