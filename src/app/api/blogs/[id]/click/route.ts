import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: Context) {
  const { id } = await context.params;

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
}
