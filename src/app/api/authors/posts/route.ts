import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";
import { enrichPostsWithAuthorImages } from "@/lib/authorImages";
import { enrichPostsWithThumbnails } from "@/lib/postImageEnrich";

export const dynamic = "force-dynamic";

const MAX_AUTHOR_NAME_LENGTH = 200;
/** Safety cap — author pages stay small; avoids unbounded payloads. */
const MAX_AUTHOR_POSTS = 500;

const mapBlog = (post: {
  id: string;
  category: string;
  title: string;
  excerpt: string;
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
  content: "", // Content intentionally omitted for speed
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
    const rawName = request.nextUrl.searchParams.get("name") ?? "";
    const authorName = rawName.trim();

    if (!authorName || authorName.length > MAX_AUTHOR_NAME_LENGTH) {
      return NextResponse.json({ error: "Invalid author name" }, { status: 400 });
    }

    await ensureBlogSchema();

    const authorKey = authorName.toLowerCase();

    // Narrow by trimmed equality in SQL so we do not pull the full feed.
    // Case-insensitive match mirrors the author page's previous client filter.
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        category: string;
        title: string;
        excerpt: string;
        author: string;
        postImage: string | null;
        imageFocus: string | null;
        imageFocusHero: string | null;
        imageFocusGround: string | null;
        authorImage: string | null;
        clickCount: number;
        uploaderName: string | null;
        createdAt: Date;
      }>
    >`
      SELECT
        \`id\`, \`category\`, \`title\`, \`excerpt\`, \`author\`,
        \`postImage\`, \`imageFocus\`, \`imageFocusHero\`, \`imageFocusGround\`, \`authorImage\`, \`clickCount\`,
        \`uploaderName\`, \`createdAt\`
      FROM \`BlogPost\`
      WHERE \`isHidden\` = false
        AND LOWER(TRIM(\`author\`)) = ${authorKey}
      ORDER BY \`createdAt\` DESC
      LIMIT ${Prisma.raw(String(MAX_AUTHOR_POSTS))}
    `;

    const posts = await enrichPostsWithThumbnails(
      await enrichPostsWithAuthorImages(rows),
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
  } catch (err) {
    console.error("GET /api/authors/posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
