import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";

type Context = {
  params: Promise<{ id: string }>;
};

const mapComment = (comment: {
  id: string;
  name: string;
  comment: string;
  createdAt: Date;
}) => ({
  id: comment.id,
  name: comment.name,
  comment: comment.comment,
  createdAt: comment.createdAt.toISOString(),
});

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    await ensureBlogSchema();
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comments = await prisma.articleComment.findMany({
      where: { blogPostId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, comment: true, createdAt: true },
    });

    return NextResponse.json({ comments: comments.map(mapComment) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    await ensureBlogSchema();
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      comment?: string;
    };

    const name = body.name?.trim() || "";
    const email = body.email?.trim() || "";
    const comment = body.comment?.trim() || "";

    if (!name || name.length > 120) {
      return NextResponse.json({ error: "कृपया वैध नाम दर्ज करें।" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
      return NextResponse.json({ error: "कृपया वैध ईमेल दर्ज करें।" }, { status: 400 });
    }
    if (!comment || comment.length > 5000) {
      return NextResponse.json({ error: "कृपया टिप्पणी लिखें।" }, { status: 400 });
    }

    const created = await prisma.articleComment.create({
      data: { blogPostId: id, name, email, comment },
      select: { id: true, name: true, comment: true, createdAt: true },
    });

    return NextResponse.json({ comment: mapComment(created) }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 });
  }
}
