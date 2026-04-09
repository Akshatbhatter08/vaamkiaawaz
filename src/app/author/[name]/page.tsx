 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const decodeAuthorName = (value: string) => {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
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

export default function AuthorPage({ params }: { params: { name: string } }) {
  const authorName = useMemo(() => decodeAuthorName(params.name), [params.name]);
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
          <div className="mt-4 flex items-center gap-3">
            {authorImage && <img src={authorImage} alt={authorName} className="h-14 w-14 rounded-full object-cover" />}
            <div>
              <h1 className="font-serif text-3xl font-bold text-[var(--headline)]">{authorName}</h1>
              <p className="text-sm text-[var(--muted)]">{posts.length} प्रकाशित लेख</p>
            </div>
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
          <section className="grid gap-4">
            {posts.map((post) => (
              <article key={post.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">{post.category}</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--headline)]">{post.title}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">{post.excerpt}</p>
                {post.postImage && (
                  <img src={post.postImage} alt={post.title} className="mt-3 max-h-72 w-full rounded-lg object-cover" />
                )}
                <p className="mt-3 text-xs text-[var(--muted)]">{formatDate(post.createdAt)}</p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
