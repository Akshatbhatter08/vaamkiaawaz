import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateContributorCode } from "@/lib/contributorCode";
import { validatePasswordStrength } from "@/lib/tiptapSanitize";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MASTER_ADMIN_AUTHOR_NAME = "केशव कुमार भट्टड़ ";

export async function POST(request: Request) {
  try {
    const setupSecret = process.env.SETUP_SECRET?.trim();
    if (!setupSecret || setupSecret.length < 16) {
      return NextResponse.json(
        { error: "Setup is disabled. Set SETUP_SECRET to bootstrap." },
        { status: 403 },
      );
    }

    const ip = getClientIp(request);
    const limit = checkRateLimit(`setup:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many setup attempts." }, { status: 429 });
    }

    const { email, password, setupSecret: providedSecret } = await request.json();

    if (!providedSecret || providedSecret !== setupSecret) {
      return NextResponse.json({ error: "Invalid setup secret." }, { status: 403 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const passwordError = validatePasswordStrength(String(password));
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await prisma.$transaction(async (tx) => {
      const masterAdminCount = await tx.user.count({
        where: { role: "MASTER_ADMIN" },
      });

      if (masterAdminCount > 0) {
        return { error: "Master Admin already exists." as const, status: 403 as const };
      }

      const passwordHash = await hashPassword(password);
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: "MASTER_ADMIN",
          permissions: JSON.stringify({
            authorName: MASTER_ADMIN_AUTHOR_NAME,
            contributorCode: generateContributorCode(),
          }),
        },
      });

      return { user };
    });

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        message: "Master Admin created successfully!",
        user: { id: result.user!.id, email: result.user!.email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/auth/setup error:", error);
    return NextResponse.json({ error: "An error occurred during setup." }, { status: 500 });
  }
}
