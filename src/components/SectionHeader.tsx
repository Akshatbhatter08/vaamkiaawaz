"use client";

import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  href?: string;
  linkText?: string;
  badge?: string;
}

export function SectionHeader({ title, href, linkText = "सभी देखें →", badge }: SectionHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
      {badge && (
        <span
          style={{
            background: "var(--crimson)",
            color: "white",
            fontFamily: "Inter, sans-serif",
            fontSize: "10px",
            fontWeight: 700,
            padding: "3px 8px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--gold)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {title}
      </span>
      <div style={{ flex: 1, height: "1px", background: "var(--crimson)" }} />
      {href && (
        <Link
          href={href}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "var(--gold)",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}
