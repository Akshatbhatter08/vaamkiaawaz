 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState, use } from "react";
import AuthorProfileBox from "@/components/AuthorProfileBox";

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

export default function AuthorPage({ params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = use(params);
  const authorName = useMemo(() => decodeAuthorName(resolvedParams.name), [resolvedParams.name]);
  const [posts, setPosts] = useState<ApiBlogPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <Link href="/" className="text-sm font-semibold text-[var(--primary)]">
            ← होम पर वापस जाएँ
          </Link>
          <div className="mt-4">
            <AuthorProfileBox
              authorName={authorName}
              authorImage={authorImage}
              authorPosts={posts}
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
            लेख लोड हो रहे हैं...
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
            इस लेखक के लिए अभी कोई लेख उपलब्ध नहीं है।
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {posts.map((post) => (
              <Link 
                key={post.id} 
                href={`/post/${post.id}`}
                className="rise-on-hover cursor-pointer rounded-lg border border-[var(--line)] p-4 text-left transition-all block bg-[var(--surface)]"
              >
                {post.postImage && (
                  <img src={post.postImage} alt={post.title} className="mb-3 h-40 w-full rounded-md object-cover" />
                )}
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">{post.category}</p>
                <h4 className="line-clamp-2 mt-2 text-xl font-semibold text-[var(--headline)]">{post.title}</h4>
                <div className="line-clamp-3 mt-2 text-sm text-[var(--muted)] excerpt-html" dangerouslySetInnerHTML={{ __html: cleanHtml(post.excerpt) }} />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <div className="inline-flex items-center gap-2">
                    {post.authorImage && (
                      <img src={post.authorImage} alt={post.author} className="h-5 w-5 rounded-full object-cover" />
                    )}
                    <span className="font-medium text-[var(--foreground)]">{post.author}</span>
                  </div>
                  <span>•</span>
                  <span>{formatDate(post.createdAt)}</span>
                  <span>•</span>
                  <span>{post.clickCount ?? 0} क्लिक</span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
