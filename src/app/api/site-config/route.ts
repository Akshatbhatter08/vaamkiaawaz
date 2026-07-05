import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { readSiteConfig, writeSiteConfig } from "@/lib/siteConfig";

export async function GET() {
  try {
    const config = await readSiteConfig();
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ featuredVicharPostIds: [] });
  }
}

export async function PATCH(request: NextRequest) {
  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) return authPayload;

  const userId = authPayload.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { featuredVicharPostIds?: unknown };
  if (!Array.isArray(body.featuredVicharPostIds)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const featuredVicharPostIds = body.featuredVicharPostIds.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0,
  );

  await writeSiteConfig({ featuredVicharPostIds });
  return NextResponse.json({ featuredVicharPostIds });
}
