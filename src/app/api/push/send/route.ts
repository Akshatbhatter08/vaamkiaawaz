import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { parseUserPermissions } from "@/lib/contributorCode";
import {
  configureWebPush,
  ensurePushSubscriptionTable,
  parseAffinity,
  parseSubscription,
} from "@/lib/push";

export const dynamic = "force-dynamic";

type SubscriptionRow = {
  id: string;
  endpointHash: string;
  subscription: string;
  affinity: string;
};

const toPlainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

export async function POST(request: NextRequest) {
  try {
    const authPayload = await requireAuth(request);
    if (authPayload instanceof NextResponse) return authPayload;
    const userId = authPayload.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, permissions: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const parsedPermissions = parseUserPermissions(user.permissions);
    const canSend =
      user.role === "MASTER_ADMIN" ||
      (user.role === "ADMIN" && parsedPermissions.publishBlog === true);
    if (!canSend) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!configureWebPush()) {
      return NextResponse.json(
        { error: "पुश नोटिफिकेशन कॉन्फ़िगर नहीं है (VAPID कुंजी अनुपलब्ध)।" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { postId?: unknown };
    const postId = typeof body.postId === "string" ? body.postId.trim() : "";
    if (!postId) {
      return NextResponse.json({ error: "अमान्य लेख।" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, title: true, excerpt: true, category: true, isHidden: true },
    });
    if (!post || post.isHidden) {
      return NextResponse.json({ error: "लेख नहीं मिला।" }, { status: 404 });
    }

    await ensurePushSubscriptionTable();
    const rows = await prisma.$queryRawUnsafe<SubscriptionRow[]>(
      "SELECT `id`, `endpointHash`, `subscription`, `affinity` FROM `PushSubscription`",
    );

    /* Affinity snapshots are JSON blobs with Hindi category names as keys, so matching happens in
       JS rather than in SQL. Fine at current subscriber scale. */
    const category = post.category.trim();
    const matching = rows.filter((row) => {
      try {
        return (parseAffinity(JSON.parse(row.affinity))[category] || 0) > 0;
      } catch {
        return false;
      }
    });

    const origin = new URL(request.url).origin;
    const payload = JSON.stringify({
      title: post.title,
      body: toPlainText(post.excerpt).slice(0, 160),
      url: `${origin}/post/${post.id}`,
    });

    let sent = 0;
    const expired: string[] = [];

    for (const row of matching) {
      const subscription = parseSubscription(JSON.parse(row.subscription));
      if (!subscription) {
        expired.push(row.endpointHash);
        continue;
      }
      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        // 404/410 mean the push service dropped the subscription for good — stop retrying it.
        if (statusCode === 404 || statusCode === 410) {
          expired.push(row.endpointHash);
        } else {
          console.error("push send failed:", statusCode, (error as Error).message);
        }
      }
    }

    for (const endpointHash of expired) {
      await prisma
        .$executeRawUnsafe("DELETE FROM `PushSubscription` WHERE `endpointHash` = ?", endpointHash)
        .catch(() => undefined);
    }

    return NextResponse.json({
      sent,
      matched: matching.length,
      removed: expired.length,
    });
  } catch (error) {
    console.error("POST /api/push/send error:", error);
    return NextResponse.json({ error: "नोटिफिकेशन भेजने में विफल।" }, { status: 500 });
  }
}
