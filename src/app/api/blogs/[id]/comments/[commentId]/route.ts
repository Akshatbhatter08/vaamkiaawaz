import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ensureBlogSchema } from "@/lib/db-setup";

type Context = {
  params: Promise<{ id: string; commentId: string }>;
};

export async function DELETE(request: NextRequest, context: Context) {
  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) return authPayload;

  const userId = authPayload.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "MASTER_ADMIN") {
    return NextResponse.json(
      { error: "केवल मास्टर एडमिन ही टिप्पणी हटा सकते हैं।" },
      { status: 403 }
    );
  }

  const { id, commentId } = await context.params;

  try {
    await ensureBlogSchema();
    const existing = await prisma.articleComment.findFirst({
      where: { id: commentId, blogPostId: id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await prisma.articleComment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE comment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
