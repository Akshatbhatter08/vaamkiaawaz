import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: Context) {
  const { id } = await context.params;

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
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Post not found in database (likely a static mock post)." }, { status: 404 });
    }
    console.error("Failed to update click count for", id, error);
    return NextResponse.json({ error: "Could not update click count" }, { status: 500 });
  }
}
