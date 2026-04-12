import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email, code } = await request.json() as { email?: string; code?: string };
  if (!email || !code) {
    return NextResponse.json({ error: "ईमेल और कोड आवश्यक हैं।" }, { status: 400 });
  }

  const results = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, code, expiresAt FROM \`Otp\` WHERE email = ? AND verified = false ORDER BY expiresAt DESC LIMIT 1`,
    email
  );

  if (results.length === 0) {
    return NextResponse.json({ error: "कोई वैद्य OTP नहीं मिला।" }, { status: 400 });
  }

  const record = results[0];
  if (record.code !== code) {
    return NextResponse.json({ error: "अमान्य OTP।" }, { status: 400 });
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "OTP की समय सीमा समाप्त हो गई है।" }, { status: 400 });
  }

  await prisma.$executeRawUnsafe(
    `UPDATE \`Otp\` SET verified = true WHERE id = ?`,
    record.id
  );

  return NextResponse.json({ success: true, message: "ईमेल सफलतापूर्वक सत्यापित हुआ।" }, { status: 200 });
}
