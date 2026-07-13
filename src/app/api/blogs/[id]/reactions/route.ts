import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type Context = {
  params: Promise<{ id: string }>;
};

function isValidVisitorId(visitorId: string): boolean {
  return /^[A-Za-z0-9_-]{8,191}$/.test(visitorId);
}

export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const visitorId = request.nextUrl.searchParams.get("visitorId")?.trim() || "";

  try {
    await ensureBlogSchema();
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, likeCount: true, dislikeCount: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let userReaction: "like" | "dislike" | null = null;
    if (visitorId && isValidVisitorId(visitorId)) {
      const existing = await prisma.articleReaction.findUnique({
        where: { blogPostId_visitorId: { blogPostId: id, visitorId } },
        select: { reaction: true },
      });
      if (existing?.reaction === "like" || existing?.reaction === "dislike") {
        userReaction = existing.reaction;
      }
    }

    return NextResponse.json({
      likeCount: post.likeCount,
      dislikeCount: post.dislikeCount,
      userReaction,
    });
  } catch (err) {
    console.error("GET reactions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Context) {
  const { id } = await context.params;

  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`reaction:${ip}:${id}`, 40, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
      );
    }

    await ensureBlogSchema();
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      visitorId?: string;
      reaction?: "like" | "dislike" | null;
    };

    const visitorId = body.visitorId?.trim() || "";
    const reaction = body.reaction;

    if (!visitorId || !isValidVisitorId(visitorId)) {
      return NextResponse.json({ error: "Invalid visitor id" }, { status: 400 });
    }
    if (reaction !== "like" && reaction !== "dislike" && reaction !== null) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.articleReaction.findUnique({
        where: { blogPostId_visitorId: { blogPostId: id, visitorId } },
      });

      let likeDelta = 0;
      let dislikeDelta = 0;

      if (!existing) {
        if (reaction === "like") likeDelta = 1;
        else if (reaction === "dislike") dislikeDelta = 1;
        if (reaction) {
          await tx.articleReaction.create({
            data: { blogPostId: id, visitorId, reaction },
          });
        }
      } else if (reaction === null) {
        if (existing.reaction === "like") likeDelta = -1;
        else if (existing.reaction === "dislike") dislikeDelta = -1;
        await tx.articleReaction.delete({ where: { id: existing.id } });
      } else if (existing.reaction !== reaction) {
        if (existing.reaction === "like") likeDelta = -1;
        else if (existing.reaction === "dislike") dislikeDelta = -1;
        if (reaction === "like") likeDelta += 1;
        else if (reaction === "dislike") dislikeDelta += 1;
        await tx.articleReaction.update({
          where: { id: existing.id },
          data: { reaction },
        });
      }

      const updated = await tx.blogPost.update({
        where: { id },
        data: {
          likeCount: { increment: likeDelta },
          dislikeCount: { increment: dislikeDelta },
        },
        select: { likeCount: true, dislikeCount: true },
      });

      return { ...updated, userReaction: reaction };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST reactions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
