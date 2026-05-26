"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Calendar, BarChart3 } from "lucide-react";

type Post = {
  id: string;
  title: string;
  author: string;
  category: string;
  clickCount: number;
  createdAt: Date;
};

export default function ReportsClient({ posts }: { posts: Post[] }) {
  const [filterMode, setFilterMode] = useState<"author" | "date">("author");

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
    // Sort dates descending (newest first, based on the first post's actual Date object in that group)
    return Object.values(stats).sort((a, b) => {
      const dateA = new Date(a.posts[0].createdAt).getTime();
      const dateB = new Date(b.posts[0].createdAt).getTime();
      return dateB - dateA;
    });
  }, [posts]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-10">
      {/* Header */}
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

      {/* Main Content */}
      <main className="container mx-auto mt-8 px-4 lg:px-8 max-w-5xl">
        {/* Toggle Controls */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1 shadow-sm">
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
          </div>
        </div>

        {/* Reports View */}
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
        </div>
      </main>
    </div>
  );
}
