import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBlogPostCards } from "@/lib/blogPostCards";
import { readBlogPostIdsForStruggleTracker } from "@/lib/articleStruggleTag";
import { ensureStruggleTrackerTable } from "@/lib/struggleTracker";

/** GET /api/struggle-tracker/[id]/articles — Public list of articles tagged with a movement */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureStruggleTrackerTable();

    const movement = await prisma.struggleTracker.findUnique({ where: { id } });
    if (!movement) {
      return NextResponse.json({ error: "संघर्ष नहीं मिला" }, { status: 404 });
    }

    const blogPostIds = await readBlogPostIdsForStruggleTracker(id);
    const posts = await fetchBlogPostCards(blogPostIds);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("GET /api/struggle-tracker/[id]/articles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
