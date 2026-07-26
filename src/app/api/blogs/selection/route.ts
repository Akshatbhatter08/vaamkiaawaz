import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureBlogSchema();

    const authPayload = await requireAuth(request);
    if (authPayload instanceof NextResponse) return authPayload;

    const user = await prisma.user.findUnique({
      where: { id: authPayload.id as string },
      select: { role: true },
    });

    if (!user || user.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const posts = await prisma.blogPost.findMany({
      where: { isHidden: false },
      select: {
        id: true,
        title: true,
        author: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        author: post.author,
        createdAt: post.createdAt.toISOString(),
      })),
    });
  } catch (err: unknown) {
    console.error("GET /api/blogs/selection error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
