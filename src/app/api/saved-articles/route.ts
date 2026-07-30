import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";
import { requireUser } from "@/lib/requireUser";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

/** Ids of the articles the logged-in account has saved, newest first. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    await ensureBlogSchema();
    const saved = await prisma.savedArticle.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { blogPostId: true },
    });

    return NextResponse.json(
      { ids: saved.map((row) => row.blogPostId) },
      { headers: noStore },
    );
  } catch (err) {
    console.error("GET /api/saved-articles error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Toggle a save for the logged-in account. Body: { blogPostId, saved }. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    const ip = getClientIp(request);
    const limit = checkRateLimit(`saved-articles:${ip}`, 120, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
      );
    }

    const body = (await request.json()) as { blogPostId?: string; saved?: boolean };
    const blogPostId = body.blogPostId?.trim() || "";
    if (!blogPostId) {
      return NextResponse.json({ error: "Invalid article id" }, { status: 400 });
    }

    await ensureBlogSchema();
    const post = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (body.saved === false) {
      await prisma.savedArticle.deleteMany({ where: { userId: user.id, blogPostId } });
      return NextResponse.json({ saved: false }, { headers: noStore });
    }

    await prisma.savedArticle.upsert({
      where: { userId_blogPostId: { userId: user.id, blogPostId } },
      create: { userId: user.id, blogPostId },
      update: {},
    });
    return NextResponse.json({ saved: true }, { headers: noStore });
  } catch (err) {
    console.error("POST /api/saved-articles error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
