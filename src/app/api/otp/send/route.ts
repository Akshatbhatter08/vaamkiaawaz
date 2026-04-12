import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";

const ensureOtpSchema = async () => {
  const tableCheck = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*) as count
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'Otp'
  `);
  
  if (Number(tableCheck[0].count) === 0) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`Otp\` (
        \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
        \`email\` VARCHAR(191) NOT NULL,
        \`code\` VARCHAR(191) NOT NULL,
        \`expiresAt\` DATETIME(3) NOT NULL,
        \`verified\` BOOLEAN NOT NULL DEFAULT false,
        INDEX \`Otp_email_idx\`(\`email\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }
};

export async function POST(request: NextRequest) {
  try {
    await ensureOtpSchema();
  } catch (error) {
    console.error("Schema error:", error);
    return NextResponse.json({ error: "डेटाबेस त्रुटि।" }, { status: 500 });
  }

  const { email } = await request.json() as { email?: string };
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ error: "कृपया वैध ईमेल दर्ज करें।" }, { status: 400 });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.$executeRawUnsafe(
    `INSERT INTO \`Otp\` (\`id\`, \`email\`, \`code\`, \`expiresAt\`, \`verified\`) VALUES (?, ?, ?, ?, ?)`,
    id, email, otp, expiresAt, false
  );

  const transporter = nodemailer.createTransport({
    service: 'gmail',
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
    return NextResponse.json({ error: "ईमेल भेजने में विफल। कृपया SMTP सेटिंग्स की जांच करें।" }, { status: 500 });
  }
}
