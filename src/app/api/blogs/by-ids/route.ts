import { NextRequest, NextResponse } from "next/server";
import { ensureBlogSchema } from "@/lib/db-setup";
import { fetchBlogPostCards } from "@/lib/blogPostCards";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureBlogSchema();
    const idsParam = request.nextUrl.searchParams.get("ids")?.trim();
    if (!idsParam) {
      return NextResponse.json({ posts: [] });
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const posts = await fetchBlogPostCards(ids);

    return NextResponse.json(
      { posts },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err: unknown) {
    console.error("GET /api/blogs/by-ids error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
