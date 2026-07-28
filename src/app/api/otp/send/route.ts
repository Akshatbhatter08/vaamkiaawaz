import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { hashOtpCode } from "@/lib/tiptapSanitize";
import { ensureOtpSchema } from "@/lib/otpSchema";

const OTP_PURPOSES = new Set(["newsletter", "register"]);

export async function POST(request: NextRequest) {
  try {
    await ensureOtpSchema();
  } catch (error) {
    console.error("Schema error in OTP:", error);
    return NextResponse.json({ error: "डेटाबेस त्रुटि।" }, { status: 500 });
  }

  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(`otp-send:ip:${ip}`, 10, 15 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "बहुत अधिक अनुरोध। कृपया बाद में प्रयास करें।" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
    );
  }

  const body = (await request.json()) as { email?: string; purpose?: string };
  const email = body.email?.trim().toLowerCase() || "";
  const purpose = (body.purpose || "register").trim().toLowerCase();

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ error: "कृपया वैध ईमेल दर्ज करें।" }, { status: 400 });
  }
  if (!OTP_PURPOSES.has(purpose)) {
    return NextResponse.json({ error: "अमान्य OTP purpose।" }, { status: 400 });
  }

  const emailLimit = checkRateLimit(`otp-send:email:${email}`, 5, 15 * 60 * 1000);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { error: "इस ईमेल पर बहुत अधिक OTP अनुरोध। कृपया बाद में प्रयास करें।" },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSec) } },
    );
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const codeHash = hashOtpCode(otp);
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.$executeRawUnsafe(
    `INSERT INTO \`Otp\` (\`id\`, \`email\`, \`code\`, \`purpose\`, \`attempts\`, \`expiresAt\`, \`verified\`) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    email,
    codeHash,
    purpose,
    0,
    expiresAt,
    false,
  );

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"वाम की आवाज़" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "OTP Verification - वाम की आवाज़",
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>वाम की आवाज़ में आपका स्वागत है</h2>
          <p>आपका वेरिफिकेशन कोड नीचे दिया गया है। यह कोड 10 मिनट के लिए मान्य है:</p>
          <h1 style="color: #9f171b; letter-spacing: 4px;">${otp}</h1>
          <p>कृपया इस कोड को किसी के साथ साझा न करें।</p>
        </div>
      `,
    });
    return NextResponse.json({ success: true, message: "OTP भेजा गया।" }, { status: 200 });
  } catch (error) {
    console.error("Mail error:", error);
    return NextResponse.json(
      { error: "ईमेल भेजने में विफल। कृपया SMTP सेटिंग्स की जांच करें।" },
      { status: 500 },
    );
  }
}
