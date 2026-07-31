import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensurePushSubscriptionTable, hashEndpoint } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { endpoint?: unknown };
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
    if (!endpoint) {
      return NextResponse.json({ error: "अमान्य अनुरोध।" }, { status: 400 });
    }

    await ensurePushSubscriptionTable();
    await prisma.$executeRawUnsafe(
      "DELETE FROM `PushSubscription` WHERE `endpointHash` = ?",
      hashEndpoint(endpoint),
    );

    return NextResponse.json({ subscribed: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/push/unsubscribe error:", error);
    return NextResponse.json({ error: "अनसब्सक्राइब विफल।" }, { status: 500 });
  }
}
