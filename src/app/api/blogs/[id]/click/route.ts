import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const ip = getClientIp(request);
  const limit = checkRateLimit(`click:${ip}:${id}`, 30, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      id: post.id,
      clickCount: post.clickCount,
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    console.error("Failed to update click count for", id, error);
    return NextResponse.json({ error: "Could not update click count" }, { status: 500 });
  }
}
