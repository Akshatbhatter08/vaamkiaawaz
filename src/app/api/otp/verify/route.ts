import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signOtpProof } from "@/lib/auth";
import { checkRateLimit, clearFailures, getClientIp, getLockStatus, recordFailure } from "@/lib/rateLimit";
import { hashOtpCode, timingSafeEqualString } from "@/lib/tiptapSanitize";
import { ensureOtpSchema } from "@/lib/otpSchema";

const MAX_VERIFY_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    await ensureOtpSchema();
  } catch (error) {
    console.error("Schema error in OTP verify:", error);
    return NextResponse.json({ error: "डेटाबेस त्रुटि।" }, { status: 500 });
  }

  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(`otp-verify:ip:${ip}`, 30, 15 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "बहुत अधिक अनुरोध। कृपया बाद में प्रयास करें।" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
    );
  }

  const body = (await request.json()) as { email?: string; code?: string; purpose?: string };
  const email = body.email?.trim().toLowerCase() || "";
  const code = body.code?.trim() || "";
  const purpose = (body.purpose || "register").trim().toLowerCase();

  if (!email || !code) {
    return NextResponse.json({ error: "ईमेल और कोड आवश्यक हैं।" }, { status: 400 });
  }

  const emailLimit = checkRateLimit(`otp-verify:email:${email}`, 15, 15 * 60 * 1000);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { error: "बहुत अधिक प्रयास। कृपया बाद में प्रयास करें।" },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSec) } },
    );
  }

  const failKey = `otp-verify-fail:${email}`;
  const locked = getLockStatus(failKey);
  if (!locked.ok) {
    return NextResponse.json(
      { error: "बहुत अधिक गलत प्रयास। कृपया बाद में प्रयास करें।" },
      { status: 429, headers: { "Retry-After": String(locked.retryAfterSec) } },
    );
  }

  const results = await prisma.$queryRawUnsafe<
    { id: string; code: string; expiresAt: Date; attempts: number; purpose: string }[]
  >(
    `SELECT id, code, expiresAt, COALESCE(attempts, 0) as attempts, COALESCE(purpose, 'register') as purpose
     FROM \`Otp\`
     WHERE email = ? AND verified = false AND COALESCE(purpose, 'register') = ?
     ORDER BY expiresAt DESC LIMIT 1`,
    email,
    purpose,
  );

  if (results.length === 0) {
    return NextResponse.json({ error: "कोई वैद्य OTP नहीं मिला।" }, { status: 400 });
  }

  const record = results[0];
  if (Number(record.attempts) >= MAX_VERIFY_ATTEMPTS) {
    return NextResponse.json(
      { error: "अधिकतम प्रयास पूरे हो गए। नया OTP मंगाएँ।" },
      { status: 429 },
    );
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "OTP की समय सीमा समाप्त हो गई है।" }, { status: 400 });
  }

  const codeHash = hashOtpCode(code);
  const stored = String(record.code);
  const matches =
    timingSafeEqualString(stored, codeHash) ||
    (stored.length === 6 && timingSafeEqualString(stored, code));

  if (!matches) {
    await prisma.$executeRawUnsafe(
      `UPDATE \`Otp\` SET attempts = COALESCE(attempts, 0) + 1 WHERE id = ?`,
      record.id,
    );
    const fail = recordFailure(failKey, 20, 30 * 60 * 1000);
    if (!fail.ok) {
      return NextResponse.json(
        { error: "बहुत अधिक गलत प्रयास। कृपया बाद में प्रयास करें।" },
        { status: 429, headers: { "Retry-After": String(fail.retryAfterSec) } },
      );
    }
    return NextResponse.json({ error: "अमान्य OTP।" }, { status: 400 });
  }

  clearFailures(failKey);
  await prisma.$executeRawUnsafe(`UPDATE \`Otp\` SET verified = true WHERE id = ?`, record.id);

  const otpProof = await signOtpProof({ email, purpose });

  return NextResponse.json(
    {
      success: true,
      message: "ईमेल सफलतापूर्वक सत्यापित हुआ।",
      otpProof,
    },
    { status: 200 },
  );
}
