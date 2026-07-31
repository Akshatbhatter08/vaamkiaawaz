import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";
import { fetchBlogPostCards } from "@/lib/blogPostCards";
import { isValidVisitorId } from "@/lib/visitorId";

export const dynamic = "force-dynamic";

const noStore = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
};

export async function GET(request: NextRequest) {
  try {
    const visitorId = request.nextUrl.searchParams.get("visitorId")?.trim() || "";
    if (!visitorId || !isValidVisitorId(visitorId)) {
      return NextResponse.json({ error: "Invalid visitor id" }, { status: 400 });
    }

    await ensureBlogSchema();
    const reactions = await prisma.articleReaction.findMany({
      where: { visitorId, reaction: "like" },
      orderBy: { createdAt: "desc" },
      select: { blogPostId: true },
    });

    const ids = reactions.map((row) => row.blogPostId);
    const posts = await fetchBlogPostCards(ids);

    return NextResponse.json({ posts }, { headers: noStore });
  } catch (err) {
    console.error("GET /api/my-activity/likes error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
