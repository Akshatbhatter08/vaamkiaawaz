import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";
import { enrichPostsWithAuthorImages } from "@/lib/authorImages";
import { enrichPostsWithThumbnails } from "@/lib/postImageEnrich";
import { matchesSearch, MIN_SEARCH_LENGTH } from "@/lib/searchUtils";
import { readingTime } from "@/utils/designUtils";

const postSelect = {
  id: true,
  category: true,
  title: true,
  excerpt: true,
  content: true,
  author: true,
  postImage: true,
  imageFocus: true,
  imageFocusHero: true,
  imageFocusGround: true,
  authorImage: true,
  clickCount: true,
  uploaderName: true,
  createdAt: true,
} as const;

const parseLimit = (value: string | null): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 24;
  return Math.min(50, Math.max(1, Math.round(parsed)));
};

const normalizeName = (value: string): string => value.trim().toLowerCase();

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mapBlog = (post: {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  postImage: string | null;
  imageFocus?: string | null;
  imageFocusHero?: string | null;
  imageFocusGround?: string | null;
  authorImage: string | null;
  clickCount: number;
  uploaderName?: string | null;
  createdAt: Date;
}) => ({
  id: post.id,
  category: post.category,
  title: post.title,
  excerpt: post.excerpt,
  content: "",
  readTime: readingTime(post.content || post.excerpt || ""),
  author: post.author,
  postImage: post.postImage,
  imageFocus: post.imageFocus ?? null,
  imageFocusHero: post.imageFocusHero ?? null,
  imageFocusGround: post.imageFocusGround ?? null,
  authorImage: post.authorImage,
  clickCount: post.clickCount,
  uploaderName: post.uploaderName ?? null,
  createdAt: post.createdAt.toISOString(),
});

export async function GET(request: NextRequest) {
  try {
    await ensureBlogSchema();

    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    if (q.length < MIN_SEARCH_LENGTH) {
      return NextResponse.json({ posts: [], hasMore: false });
    }

    const limit = parseLimit(searchParams.get("limit"));
    const before = searchParams.get("before")?.trim();
    const beforeId = searchParams.get("beforeId")?.trim();
    const category = searchParams.get("category")?.trim();
    const author = searchParams.get("author")?.trim();
    const date = searchParams.get("date")?.trim();

    const where: {
      isHidden: boolean;
      category?: string;
    } = { isHidden: false };

    if (category && category !== "सभी") {
      where.category = category;
    }

    const candidates = await prisma.blogPost.findMany({
      where,
      select: postSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const authorKey = author ? normalizeName(author) : "";
    const dateKey = date || "";

    let matched = candidates.filter((post) => {
      if (authorKey && normalizeName(post.author) !== authorKey) {
        return false;
      }
      if (dateKey && toDateKey(post.createdAt) !== dateKey) {
        return false;
      }
      return matchesSearch([post.title, post.excerpt, post.category, post.author], q);
    });

    if (before && beforeId) {
      let startIndex = matched.findIndex(
        (post) => post.id === beforeId && post.createdAt.toISOString() === before,
      );
      if (startIndex < 0) {
        startIndex = matched.findIndex((post) => post.id === beforeId);
      }
      if (startIndex >= 0) {
        matched = matched.slice(startIndex + 1);
      }
    }

    const hasMore = matched.length > limit;
    const page = matched.slice(0, limit);

    const enriched = await enrichPostsWithThumbnails(
      await enrichPostsWithAuthorImages(page),
    );

    return NextResponse.json(
      {
        posts: enriched.map(mapBlog),
        hasMore,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err: unknown) {
    console.error("GET /api/blogs/search error:", err);
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
