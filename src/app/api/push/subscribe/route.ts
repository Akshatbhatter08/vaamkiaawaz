import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  ensurePushSubscriptionTable,
  getVapidPublicKey,
  hashEndpoint,
  parseAffinity,
  parseSubscription,
} from "@/lib/push";

export const dynamic = "force-dynamic";

/* The client needs the VAPID public key before it can call pushManager.subscribe(). Served from
   here rather than a NEXT_PUBLIC_ build-time var so the key can be rotated without a rebuild. */
export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }
  return NextResponse.json({ publicKey }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`push-subscribe:${ip}`, 20, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ error: "बहुत अधिक अनुरोध।" }, { status: 429 });
    }

    const body = (await request.json()) as {
      visitorId?: unknown;
      subscription?: unknown;
      affinity?: unknown;
    };

    const visitorId =
      typeof body.visitorId === "string" ? body.visitorId.trim().slice(0, 191) : "";
    const subscription = parseSubscription(body.subscription);
    if (!visitorId || !subscription) {
      return NextResponse.json({ error: "अमान्य सब्सक्रिप्शन।" }, { status: 400 });
    }

    const affinity = parseAffinity(body.affinity);

    await ensurePushSubscriptionTable();
    await prisma.$executeRawUnsafe(
      "INSERT INTO `PushSubscription` (`id`, `visitorId`, `endpointHash`, `subscription`, `affinity`) " +
        "VALUES (?, ?, ?, ?, ?) " +
        "ON DUPLICATE KEY UPDATE `visitorId` = VALUES(`visitorId`), `subscription` = VALUES(`subscription`), `affinity` = VALUES(`affinity`)",
      randomUUID(),
      visitorId,
      hashEndpoint(subscription.endpoint),
      JSON.stringify(subscription),
      JSON.stringify(affinity),
    );

    return NextResponse.json({ subscribed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/push/subscribe error:", error);
    return NextResponse.json({ error: "सब्सक्रिप्शन सहेजने में विफल।" }, { status: 500 });
  }
}
