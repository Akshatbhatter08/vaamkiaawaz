"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Calendar, BarChart3, Globe } from "lucide-react";

type Post = {
  id: string;
  title: string;
  author: string;
  category: string;
  clickCount: number;
  createdAt: Date;
};

type AnalyticsReport = {
  range: { days: number };
  cachedAt: string;
  totals: {
    activeUsers: number;
    sessions: number;
    screenPageViews: number;
  };
  daily: Array<{
    date: string;
    activeUsers: number;
    screenPageViews: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
    users: number;
    postId: string | null;
  }>;
  topPosts: Array<{
    path: string;
    views: number;
    users: number;
    postId: string | null;
  }>;
};

const DAY_OPTIONS = [7, 14, 30, 60, 90] as const;

export default function ReportsClient({ posts }: { posts: Post[] }) {
  const [filterMode, setFilterMode] = useState<"author" | "date" | "analytics">("author");
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsReport | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  const authorStats = useMemo(() => {
    const stats: Record<string, { author: string; totalViews: number; postCount: number; posts: Post[] }> = {};
    posts.forEach((post) => {
      const author = post.author || "Unknown Author";
      if (!stats[author]) {
        stats[author] = { author, totalViews: 0, postCount: 0, posts: [] };
      }
      stats[author].totalViews += post.clickCount || 0;
      stats[author].postCount += 1;
      stats[author].posts.push(post);
    });
    return Object.values(stats).sort((a, b) => b.totalViews - a.totalViews);
  }, [posts]);

  const dateStats = useMemo(() => {
    const stats: Record<string, { date: string; totalViews: number; postCount: number; posts: Post[] }> = {};
    posts.forEach((post) => {
      const dateStr = new Date(post.createdAt).toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (!stats[dateStr]) {
        stats[dateStr] = { date: dateStr, totalViews: 0, postCount: 0, posts: [] };
      }
      stats[dateStr].totalViews += post.clickCount || 0;
      stats[dateStr].postCount += 1;
      stats[dateStr].posts.push(post);
    });
    return Object.values(stats).sort((a, b) => {
      const dateA = new Date(a.posts[0].createdAt).getTime();
      const dateB = new Date(b.posts[0].createdAt).getTime();
      return dateB - dateA;
    });
  }, [posts]);

  const postTitleById = useMemo(() => {
    const map = new Map<string, string>();
    posts.forEach((post) => map.set(post.id, post.title));
    return map;
  }, [posts]);

  const loadAnalytics = useCallback(async (days: number) => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const response = await fetch(`/api/analytics?days=${days}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await response.json()) as AnalyticsReport & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Google Analytics डेटा लोड नहीं हो सका।");
      }
      setAnalyticsData(data);
    } catch (error) {
      setAnalyticsData(null);
      setAnalyticsError(error instanceof Error ? error.message : "Google Analytics डेटा लोड नहीं हो सका।");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filterMode !== "analytics") return;
    void loadAnalytics(analyticsDays);
  }, [filterMode, analyticsDays, loadAnalytics]);

  const formatGaNumber = (value: number) => new Intl.NumberFormat("hi-IN").format(value);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-10">
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface)] shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="rounded-full border border-[var(--line)] p-2 hover:bg-[var(--surface-soft)]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-serif text-2xl font-bold text-[var(--headline)]">पोस्ट प्रदर्शन रिपोर्ट (Reports)</h1>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
            <span className="font-semibold">{posts.length} कुल पोस्ट</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4 lg:px-8 max-w-5xl">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="inline-flex flex-wrap justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1 shadow-sm">
            <button
              onClick={() => setFilterMode("author")}
              className={`flex items-center gap-2 rounded-md px-6 py-2 text-sm font-semibold transition-colors ${
                filterMode === "author"
                  ? "bg-[var(--primary)] text-white shadow"
                  : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--headline)]"
              }`}
            >
              <User className="h-4 w-4" />
              लेखक के अनुसार (Author-wise)
            </button>
            <button
              onClick={() => setFilterMode("date")}
              className={`flex items-center gap-2 rounded-md px-6 py-2 text-sm font-semibold transition-colors ${
                filterMode === "date"
                  ? "bg-[var(--primary)] text-white shadow"
                  : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--headline)]"
              }`}
            >
              <Calendar className="h-4 w-4" />
              तिथि के अनुसार (Date-wise)
            </button>
            <button
              onClick={() => setFilterMode("analytics")}
              className={`flex items-center gap-2 rounded-md px-6 py-2 text-sm font-semibold transition-colors ${
                filterMode === "analytics"
                  ? "bg-[var(--primary)] text-white shadow"
                  : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--headline)]"
              }`}
            >
              <Globe className="h-4 w-4" />
              Google Analytics
            </button>
          </div>

          {filterMode === "analytics" && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-semibold text-[var(--muted)]">अवधि:</span>
              {DAY_OPTIONS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setAnalyticsDays(days)}
                  className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                    analyticsDays === days
                      ? "bg-[var(--primary)] text-white"
                      : "border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--headline)]"
                  }`}
                >
                  {days} दिन
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {filterMode === "author" &&
            authorStats.map((stat) => (
              <div key={stat.author} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <h2 className="text-xl font-bold text-[var(--headline)] flex items-center gap-2">
                    <User className="h-5 w-5 text-[var(--primary)]" />
                    {stat.author}
                  </h2>
                  <div className="flex gap-4 text-sm">
                    <span className="font-semibold text-[var(--muted)]">पोस्ट: <span className="text-[var(--foreground)]">{stat.postCount}</span></span>
                    <span className="font-semibold text-[var(--muted)]">कुल व्यूज़: <span className="text-[var(--primary)]">{stat.totalViews}</span></span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {stat.posts.map((post) => (
                    <div key={post.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                      <p className="text-xs font-semibold uppercase text-[var(--primary)]">{post.category}</p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-bold text-[var(--headline)]" title={post.title}>{post.title}</h3>
                      <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                        <span>{new Date(post.createdAt).toLocaleDateString("hi-IN")}</span>
                        <span className="flex items-center gap-1 font-bold text-[var(--foreground)]">
                          <BarChart3 className="h-3 w-3" /> {post.clickCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {filterMode === "date" &&
            dateStats.map((stat) => (
              <div key={stat.date} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <h2 className="text-xl font-bold text-[var(--headline)] flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[var(--primary)]" />
                    {stat.date}
                  </h2>
                  <div className="flex gap-4 text-sm">
                    <span className="font-semibold text-[var(--muted)]">पोस्ट: <span className="text-[var(--foreground)]">{stat.postCount}</span></span>
                    <span className="font-semibold text-[var(--muted)]">कुल व्यूज़: <span className="text-[var(--primary)]">{stat.totalViews}</span></span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {stat.posts.map((post) => (
                    <div key={post.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                      <p className="text-xs font-semibold uppercase text-[var(--primary)]">{post.category}</p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-bold text-[var(--headline)]" title={post.title}>{post.title}</h3>
                      <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> <span className="truncate max-w-[100px]">{post.author}</span></span>
                        <span className="flex items-center gap-1 font-bold text-[var(--foreground)]">
                          <BarChart3 className="h-3 w-3" /> {post.clickCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {filterMode === "analytics" && (
            <>
              {analyticsLoading && (
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
                  Google Analytics डेटा लोड हो रहा है…
                </div>
              )}

              {!analyticsLoading && analyticsError && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-700">
                  {analyticsError}
                </div>
              )}

              {!analyticsLoading && !analyticsError && analyticsData && (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">सक्रिय उपयोगकर्ता</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--headline)]">{formatGaNumber(analyticsData.totals.activeUsers)}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">सत्र (Sessions)</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--headline)]">{formatGaNumber(analyticsData.totals.sessions)}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">पेज व्यूज़</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--primary)]">{formatGaNumber(analyticsData.totals.screenPageViews)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
                      <h2 className="text-xl font-bold text-[var(--headline)] flex items-center gap-2">
                        <Globe className="h-5 w-5 text-[var(--primary)]" />
                        शीर्ष लेख (GA)
                      </h2>
                      <span className="text-xs text-[var(--muted)]">पिछले {analyticsData.range.days} दिन</span>
                    </div>
                    {analyticsData.topPosts.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">इस अवधि में कोई लेख पेज डेटा नहीं मिला।</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {analyticsData.topPosts.map((row) => (
                          <div key={row.path} className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                            <h3 className="line-clamp-2 text-sm font-bold text-[var(--headline)]" title={row.postId ? postTitleById.get(row.postId) ?? row.path : row.path}>
                              {row.postId ? postTitleById.get(row.postId) ?? row.path : row.path}
                            </h3>
                            <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                              <span>{row.path}</span>
                              <span className="flex items-center gap-1 font-bold text-[var(--foreground)]">
                                <BarChart3 className="h-3 w-3" /> {formatGaNumber(row.views)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
                      <h2 className="text-xl font-bold text-[var(--headline)] flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
                        शीर्ष पेज
                      </h2>
                      <span className="text-xs text-[var(--muted)]">कैश: {new Date(analyticsData.cachedAt).toLocaleString("hi-IN")}</span>
                    </div>
                    <div className="space-y-2">
                      {analyticsData.topPages.map((row) => (
                        <div key={row.path} className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm">
                          <span className="truncate pr-3 text-[var(--headline)]">{row.path}</span>
                          <span className="shrink-0 font-semibold text-[var(--primary)]">{formatGaNumber(row.views)} व्यूज़</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {analyticsData.daily.length > 0 && (
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                      <h2 className="mb-4 text-xl font-bold text-[var(--headline)]">दैनिक रुझान</h2>
                      <div className="space-y-2">
                        {analyticsData.daily.slice(-14).map((row) => (
                          <div key={row.date} className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm">
                            <span className="text-[var(--muted)]">{row.date}</span>
                            <span className="font-semibold text-[var(--foreground)]">
                              {formatGaNumber(row.screenPageViews)} व्यूज़ · {formatGaNumber(row.activeUsers)} उपयोगकर्ता
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
