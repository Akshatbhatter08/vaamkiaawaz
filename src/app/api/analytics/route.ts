import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { fetchAnalyticsReport, parseAnalyticsDays } from "@/lib/googleAnalytics";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authPayload = await requireAuth(request);
    if (authPayload instanceof NextResponse) return authPayload;

    const user = await prisma.user.findUnique({
      where: { id: authPayload.id as string },
      select: { role: true },
    });

    if (!user || user.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const days = parseAnalyticsDays(request.nextUrl.searchParams.get("days"));
    const report = await fetchAnalyticsReport(days);

    return NextResponse.json(report, {
      headers: {
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/analytics error:", err);
    const message = err instanceof Error ? err.message : "Analytics fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
