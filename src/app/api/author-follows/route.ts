import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";
import { requireUser } from "@/lib/requireUser";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

const MAX_AUTHOR_ID_LENGTH = 200;

/** Author byline ids the logged-in account follows, newest first. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    await ensureBlogSchema();
    const follows = await prisma.authorFollow.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { authorId: true },
    });

    return NextResponse.json(
      { ids: follows.map((row) => row.authorId) },
      { headers: noStore },
    );
  } catch (err) {
    console.error("GET /api/author-follows error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Toggle a follow for the logged-in account. Body: { authorId, following }. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    const ip = getClientIp(request);
    const limit = checkRateLimit(`author-follows:${ip}`, 120, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
      );
    }

    const body = (await request.json()) as { authorId?: string; following?: boolean };
    const authorId = body.authorId?.trim() || "";
    if (!authorId || authorId.length > MAX_AUTHOR_ID_LENGTH) {
      return NextResponse.json({ error: "Invalid author id" }, { status: 400 });
    }

    await ensureBlogSchema();

    const authorKey = authorId.toLowerCase();
    const authorExists = await prisma.$queryRaw<{ COUNT: bigint }[]>`
      SELECT COUNT(*) as COUNT
      FROM \`BlogPost\`
      WHERE \`isHidden\` = false
        AND LOWER(TRIM(\`author\`)) = ${authorKey}
      LIMIT 1
    `;
    if (!authorExists[0] || Number(authorExists[0].COUNT) === 0) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    if (body.following === false) {
      await prisma.authorFollow.deleteMany({ where: { userId: user.id, authorId } });
      return NextResponse.json({ following: false }, { headers: noStore });
    }

    await prisma.authorFollow.upsert({
      where: { userId_authorId: { userId: user.id, authorId } },
      create: { userId: user.id, authorId },
      update: {},
    });
    return NextResponse.json({ following: true }, { headers: noStore });
  } catch (err) {
    console.error("POST /api/author-follows error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
