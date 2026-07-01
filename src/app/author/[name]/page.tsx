"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, use } from "react";
import AuthorProfileBox from "@/components/AuthorProfileBox";
import { ArticleCard } from "@/components/ArticleCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getCategoryClass, formatViews, readingTime } from "@/utils/designUtils";

const decodeAuthorName = (value: string) => {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
};

const cleanHtml = (html: string | undefined | null) => {
  if (!html) return "";
  return html
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\u00A0/g, " ");
};

type ApiBlogPost = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  postImage: string | null;
  imageFocus?: string | null;
  authorImage: string | null;
  clickCount: number;
  createdAt: string;
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));

const FacebookIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <g transform="scale(1.25) translate(0 -5)">
      <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.5c0-.8.2-1.4 1.4-1.4h1.4V5.6c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.7v2h-2.3V14H11v7h2.5z" />
    </g>
  </svg>
);

const YoutubeIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <g transform="scale(1.1) translate(0 -2)">
      <path d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 2 12a30 30 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2A30 30 0 0 0 22 12a30 30 0 0 0-.4-4.8zM10 15.1V8.9l5.2 3.1L10 15.1z" />
    </g>
  </svg>
);

const TwitterIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <g transform="scale(1.1) translate(0 -2)">
      <path d="M18.9 2H22l-6.8 7.7L23 22h-6.1l-4.8-6.3L6.5 22H3.4l7.3-8.3L1 2h6.2l4.3 5.7L18.9 2zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20z" />
    </g>
  </svg>
);

export default function AuthorPage({ params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = use(params);
  const authorName = useMemo(() => decodeAuthorName(resolvedParams.name), [resolvedParams.name]);
  
  // FIXED: Moved inside the component body
  // 1. Keep track of the active theme dynamically
  const [posts, setPosts] = useState<ApiBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "views">("date");
  const [visiblePosts, setVisiblePosts] = useState(4);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // 2. Look directly at what your website root is currently set to
    const currentGlobalTheme = document.documentElement.dataset.theme as "light" | "dark" | undefined;
    
    if (currentGlobalTheme === "dark" || currentGlobalTheme === "light") {
      setTheme(currentGlobalTheme);
    } else {
      // 3. Fallback: Check localStorage if the DOM isn't updated yet
      // Ensure THEME_STORAGE_KEY matches whatever string constant you defined (e.g., "theme")
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null; 
      if (savedTheme) setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch("/api/blogs", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch blogs");
        }
        const data = (await response.json()) as { posts?: ApiBlogPost[] };
        const filtered = (data.posts ?? [])
          .filter((post) => post.author.trim().toLowerCase() === authorName.toLowerCase())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(filtered);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    void loadPosts();
  }, [authorName]);

  const authorImage = posts.find((post) => post.authorImage)?.authorImage;

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    if (sortBy === "views") {
      copy.sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0));
    } else {
      copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return copy;
  }, [posts, sortBy]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) => map.set(p.category, (map.get(p.category) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const expertise = useMemo(() => categoryCounts.map(([c]) => c).slice(0, 6), [categoryCounts]);
  const maxCount = categoryCounts.length > 0 ? categoryCounts[0][1] : 1;
  const topReads = useMemo(() => [...posts].sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0)).slice(0, 3), [posts]);
  const totalViews = useMemo(() => posts.reduce((sum, p) => sum + (p.clickCount ?? 0), 0), [posts]);

  return (
    <div className={`print:hidden ${theme === "dark" ? "theme-dark" : "theme-light"} news-shell min-h-screen`}>
      <main className="min-h-screen" style={{ background: "var(--ink)", color: "var(--text-primary)" }}>
        <div className="mx-auto w-full" style={{ maxWidth: 1280, padding: "24px" }}>
          <Link href="/" className="text-sm font-semibold" style={{ color: "var(--gold)", textDecoration: "none" }}>
            ← होम पर वापस जाएँ
          </Link>

          {/* Profile section */}
          <div className="mt-4">
            <AuthorProfileBox authorName={authorName} authorImage={authorImage} authorPosts={posts} />
          </div>

          {/* विशेषज्ञता pills */}
          {expertise.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                विशेषज्ञता
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {expertise.map((c) => (
                  <span key={c} className={`cat-pill ${getCategoryClass(c)}`}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Filter / sort bar */}
          <div
            className="article-filter-bar"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              marginBottom: 24,
              borderBottom: "1px solid var(--divider)",
              background: "var(--ink)",
            }}
          >
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>क्रमबद्ध करें:</span>
            {([
              { key: "date", label: "तारीख" },
              { key: "views", label: "सर्वाधिक पढ़े" },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortBy(opt.key)}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 14px",
                  cursor: "pointer",
                  border: "1px solid " + (sortBy === opt.key ? "var(--crimson)" : "var(--divider)"),
                  background: sortBy === opt.key ? "var(--crimson)" : "transparent",
                  color: sortBy === opt.key ? "#fff" : "var(--text-secondary)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="main-sidebar-grid">
            {/* Article grid */}
            <div>
              <SectionHeader title="इस लेखक के लेख" />
              {loading ? (
                <div className="border border-[var(--line)] p-5 text-sm" style={{ color: "var(--text-muted)" }}>लेख लोड हो रहे हैं...</div>
              ) : sortedPosts.length === 0 ? (
                <div className="border border-[var(--line)] p-5 text-sm" style={{ color: "var(--text-muted)" }}>इस लेखक के लिए अभी कोई लेख उपलब्ध नहीं है।</div>
              ) : (
                <>
                  <div className="opinion-grid">
                    {sortedPosts.slice(0, visiblePosts).map((post) => (
                      <ArticleCard
                        key={post.id}
                        title={post.title}
                        excerpt={post.excerpt}
                        imageUrl={post.postImage}
                        imageFocus={post.imageFocus}
                        categoryName={post.category}
                        categorySlug={post.category}
                        authorName={post.author}
                        authorAvatar={post.authorImage}
                        timeLabel={formatDate(post.createdAt)}
                        readTime={readingTime(post.content || post.excerpt || "")}
                        views={post.clickCount ?? 0}
                        slug={post.id}
                      />
                    ))}
                  </div>
                  {visiblePosts < sortedPosts.length && (
                    <button
                      onClick={() => setVisiblePosts((prev) => prev + 4)}
                      style={{
                        width: "100%",
                        marginTop: "24px",
                        padding: "14px",
                        background: "transparent",
                        border: "1px solid var(--divider)",
                        color: "var(--text-primary)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "background 0.2s ease"
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-soft)")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      और लेख देखें
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Quick about card */}
              <div style={{ border: "1px solid var(--divider)", background: "var(--surface-mid)", padding: 16 }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  इस लेखक के बारे में
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {authorImage ? (
                    <img src={authorImage} alt={authorName} className="avatar-circle" style={{ width: 48, height: 48, objectFit: "cover", border: "2px solid var(--crimson)" }} />
                  ) : (
                    <div className="avatar-circle" style={{ width: 48, height: 48, background: "var(--surface-high)", border: "2px solid var(--divider)" }} />
                  )}
                  <div>
                    <div style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{authorName}</div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-muted)" }}>{posts.length} लेख · {formatViews(totalViews)} कुल पाठक</div>
                  </div>
                </div>
              </div>

              {/* Categories bar chart */}
              {categoryCounts.length > 0 && (
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--divider)" }}>
                    लेखन श्रेणियाँ
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {categoryCounts.map(([cat, count]) => (
                      <div key={cat}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                          <span>{cat}</span>
                          <span style={{ color: "var(--gold)" }}>{Math.round((count / posts.length) * 100)}%</span>
                        </div>
                        <div style={{ height: 6, background: "var(--surface-high)" }}>
                          <div style={{ height: "100%", width: `${Math.max(8, (count / maxCount) * 100)}%`, background: "var(--crimson)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top reads */}
              {topReads.length > 0 && (
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--divider)" }}>
                    पाठकों की पसंद
                  </div>
                  {topReads.map((a, i) => (
                    <Link
                      key={a.id}
                      href={`/post/${a.id}`}
                      style={{ textDecoration: "none", display: "flex", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: i < topReads.length - 1 ? "1px solid var(--divider)" : "none" }}
                    >
                      <span style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 20, fontWeight: 700, color: "var(--crimson)", lineHeight: 1, flexShrink: 0, minWidth: 24 }}>{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <div style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "var(--gold)", marginTop: 3 }}>{formatViews(a.clickCount ?? 0)} पाठक · {formatDate(a.createdAt)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <footer style={{ background: "var(--ink)", borderTop: "3px solid var(--crimson)", padding: "48px 24px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="footer-grid" style={{ marginBottom: 40 }}>
            <div>
              <div style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 42, fontWeight: 700, marginBottom: 12 }} className={theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-gray-700 hover:text-[var(--primary)]"}>वाम की आवाज़</div>
              <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, lineHeight: 1.75, color: "var(--text-secondary)", marginBottom: 16 }}>
                जन संघर्षों की कहानियाँ, संदर्भ और आवाज़। हम पत्रकार नहीं, पहरेदार हैं—न्याय और समता के।
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <a href="https://www.facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer" className={theme === "dark" ? "text-[var(--text-secondary)] hover:text-white" : "text-black hover:text-[var(--primary)]"} aria-label="Facebook">
                  <FacebookIcon className="h-[18px] w-[18px]" />
                </a>
                <a href="https://www.youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer" className={theme === "dark" ? "text-[var(--text-secondary)] hover:text-white" : "text-black hover:text-[var(--primary)]"} aria-label="YouTube">
                  <YoutubeIcon className="h-[18px] w-[18px]" />
                </a>
                <a href="https://www.x.com/VaamKiAawaz" target="_blank" rel="noreferrer" className={theme === "dark" ? "text-[var(--text-secondary)] hover:text-white" : "text-black hover:text-[var(--primary)]"} aria-label="Twitter">
                  {/* FIXED: Uses TwitterIcon instead of YoutubeIcon */}
                  <TwitterIcon className="h-[18px] w-[18px]" />
                </a>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>जानकारी</div>
              {[
                { label: "हमारे बारे में", href: "/about-us" },
                { label: "संपादकीय नीति", href: "/editorial-policy" },
                { label: "सुधार नीति", href: "/corrections-policy" },
                { label: "गोपनीयता नीति", href: "/privacy-policy" },
                { label: "संपर्क करें", href: "/contact-us" },
              ].map((link) => (
                <div key={link.label} style={{ marginBottom: 8 }}>
                  <Link href={link.href} style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>आर्काइव</div>
              {["2026 के लेख", "विशेष रिपोर्ट", "पॉडकास्ट"].map((link) => (
                <div key={link} style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>{link}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-muted)" }}>© 2026 वाम की आवाज़ — जन संघर्ष का डिजिटल पुरालेख</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-muted)" }}>Made for the Movement</span>
          </div>
        </div>
      </footer>
    </div>
  );
}