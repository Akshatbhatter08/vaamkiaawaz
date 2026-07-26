import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";
import { readingTime } from "@/utils/designUtils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureBlogSchema();
    const idsParam = request.nextUrl.searchParams.get("ids")?.trim();
    if (!idsParam) {
      return NextResponse.json({ posts: [] });
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    const posts = await prisma.blogPost.findMany({
      where: {
        id: { in: ids },
        isHidden: false,
      },
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
        clickCount: true,
        createdAt: true,
      },
    });

    const byId = new Map(
      posts.map((post) => [
        post.id,
        {
          id: post.id,
          category: post.category,
          title: post.title,
          excerpt: post.excerpt,
          author: post.author,
          postImage: post.postImage,
          imageFocus: post.imageFocus ?? null,
          imageFocusHero: post.imageFocusHero ?? null,
          imageFocusGround: post.imageFocusGround ?? null,
          clickCount: post.clickCount,
          readTime: readingTime(post.content || post.excerpt || ""),
          createdAt: post.createdAt.toISOString(),
        },
      ]),
    );

    const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

    return NextResponse.json(
      { posts: ordered },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err: unknown) {
    console.error("GET /api/blogs/by-ids error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
