"use client";

import Link from "next/link";
import { getCategoryClass, formatViews, hindiRelativeTime, speakHindiText } from "@/utils/designUtils";

interface ArticleCardProps {
  title: string;
  excerpt?: string;
  imageUrl?: string | null;
  categoryName: string;
  categorySlug: string;
  authorName: string;
  authorAvatar?: string | null;
  publishedAt?: string;
  /** Pre-computed relative time label; falls back to hindiRelativeTime(publishedAt). */
  timeLabel?: string;
  readTime?: number;
  views?: number;
  slug: string;
  size?: "normal" | "large";
  onCardClick?: () => void;
}

const stripHtml = (html?: string) =>
  (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function ArticleCard({
  title,
  excerpt,
  imageUrl,
  categoryName,
  categorySlug,
  authorName,
  authorAvatar,
  publishedAt,
  timeLabel,
  readTime,
  views,
  slug,
  size = "normal",
  onCardClick,
}: ArticleCardProps) {
  const time = timeLabel ?? (publishedAt ? hindiRelativeTime(publishedAt) : "");
  const cleanExcerpt = stripHtml(excerpt);

  return (
    <Link
      href={`/post/${slug}`}
      onClick={onCardClick}
      style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}
      className="card-lift article-card"
    >
      <div style={{ background: "var(--surface-mid)", border: "1px solid var(--divider)", display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <div className="card-image-container" style={{ aspectRatio: "16/9", flexShrink: 0 }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) contrast(1.05)" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "var(--surface-high)" }} />
          )}
        </div>

        <div style={{ padding: "14px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <span className={`cat-pill ${getCategoryClass(categorySlug)}`} style={{ alignSelf: "flex-start" }}>{categoryName}</span>

          <h3
            className="card-headline"
            style={{
              fontFamily: "'Noto Serif Devanagari', serif",
              fontSize: size === "large" ? "22px" : "18px",
              fontWeight: 600,
              lineHeight: 1.4,
              color: "var(--text-primary)",
              marginTop: "8px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </h3>

          {cleanExcerpt && (
            <p
              style={{
                fontFamily: "'Noto Sans Devanagari', sans-serif",
                fontSize: "14px",
                lineHeight: 1.75,
                color: "var(--text-secondary)",
                marginTop: "6px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {cleanExcerpt}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "10px" }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "var(--gold)" }}>
              {authorName}
              {readTime ? <span style={{ opacity: 0.6 }}> · {readTime} मिनट</span> : null}
              {views !== undefined ? <span style={{ opacity: 0.6 }}> · {formatViews(views)} पाठक</span> : null}
              {time ? <span style={{ opacity: 0.6 }}> · {time}</span> : null}
            </div>
            <span
              title="यह लेख सुनें"
              style={{ fontSize: "13px", opacity: 0.7, cursor: "pointer", flexShrink: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window !== "undefined") {
                  speakHindiText(title);
                }
              }}
            >
              🔊
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
