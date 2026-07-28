import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpProof } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { randomUUID } from "crypto";

const ensureNewsletterTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`NewsletterSubscriber\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`email\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`phone\` VARCHAR(191) NULL,
      \`consentedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE INDEX \`NewsletterSubscriber_email_key\`(\`email\`),
      INDEX \`NewsletterSubscriber_email_idx\`(\`email\`),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);
};

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`newsletter:${ip}`, 10, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "बहुत अधिक अनुरोध। कृपया बाद में प्रयास करें।" },
        { status: 429 },
      );
    }

    const body = (await request.json()) as {
      email?: string;
      name?: string;
      phone?: string;
      otpProof?: string;
      consent?: boolean;
    };

    const email = body.email?.trim().toLowerCase() || "";
    const name = body.name?.trim() || "";
    const phone = body.phone?.trim() || "";
    const otpProof = body.otpProof?.trim() || "";

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "कृपया वैध ईमेल दर्ज करें।" }, { status: 400 });
    }
    if (!name || name.length > 120) {
      return NextResponse.json({ error: "कृपया वैध नाम दर्ज करें।" }, { status: 400 });
    }
    if (!phone || phone.length > 40) {
      return NextResponse.json({ error: "कृपया वैध फ़ोन नंबर दर्ज करें।" }, { status: 400 });
    }
    if (body.consent === false) {
      return NextResponse.json({ error: "सहमति आवश्यक है।" }, { status: 400 });
    }
    if (!otpProof || !(await verifyOtpProof(otpProof, { email, purpose: "newsletter" }))) {
      return NextResponse.json({ error: "ईमेल सत्यापन आवश्यक है।" }, { status: 403 });
    }

    await ensureNewsletterTable();

    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM \`NewsletterSubscriber\` WHERE email = ? LIMIT 1`,
      email,
    );

    if (existing.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE \`NewsletterSubscriber\` SET name = ?, phone = ?, consentedAt = CURRENT_TIMESTAMP(3) WHERE email = ?`,
        name,
        phone,
        email,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO \`NewsletterSubscriber\` (\`id\`, \`email\`, \`name\`, \`phone\`, \`consentedAt\`, \`createdAt\`) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
        randomUUID(),
        email,
        name,
        phone,
      );
    }

    return NextResponse.json({ success: true, message: "न्यूज़लेटर सदस्यता सफल।" });
  } catch (error) {
    console.error("POST /api/newsletter/subscribe error:", error);
    return NextResponse.json({ error: "सदस्यता सहेजने में विफल।" }, { status: 500 });
  }
}
