import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";
import { enrichPostsWithAuthorImages } from "@/lib/authorImages";
import { enrichPostsWithThumbnails } from "@/lib/postImageEnrich";
import { readingTime } from "@/utils/designUtils";

export const dynamic = "force-dynamic";

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
  createdAt: post.createdAt.toISOString(),
});

export async function GET(request: NextRequest) {
  try {
    await ensureBlogSchema();
    const author = request.nextUrl.searchParams.get("author")?.trim();
    if (!author) {
      return NextResponse.json({ error: "लेखक नाम आवश्यक है।" }, { status: 400 });
    }

    const normalizedAuthor = author.trim().toLowerCase();
    const allAuthorPosts = await prisma.blogPost.findMany({
      where: { isHidden: false },
      select: {
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
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });
    const matched = allAuthorPosts.filter(
      (post) => post.author.trim().toLowerCase() === normalizedAuthor,
    );

    const posts = await enrichPostsWithThumbnails(
      await enrichPostsWithAuthorImages(
        matched,
      ),
    );

    return NextResponse.json(
      { posts: posts.map(mapBlog) },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err: unknown) {
    console.error("GET /api/authors/posts error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
