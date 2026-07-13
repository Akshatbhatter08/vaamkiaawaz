import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import {
  checkRateLimit,
  clearFailures,
  getClientIp,
  getLockStatus,
  recordFailure,
} from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const ip = getClientIp(request);
    const normalizedIdentifier = String(email).trim().toLowerCase();

    const ipLimit = checkRateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000);
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
      );
    }

    const emailFailKey = `login:fail:${normalizedIdentifier}`;
    const ipFailKey = `login:fail-ip:${ip}`;
    const emailLocked = getLockStatus(emailFailKey);
    if (!emailLocked.ok) {
      return NextResponse.json(
        { error: "Account temporarily locked. Please try again later." },
        { status: 429, headers: { "Retry-After": String(emailLocked.retryAfterSec) } },
      );
    }
    const ipLocked = getLockStatus(ipFailKey);
    if (!ipLocked.ok) {
      return NextResponse.json(
        { error: "Too many failed logins. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLocked.retryAfterSec) } },
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedIdentifier } });

    if (!user) {
      recordFailure(emailFailKey, 8, 15 * 60 * 1000);
      recordFailure(ipFailKey, 20, 15 * 60 * 1000);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);

    if (!isMatch) {
      recordFailure(emailFailKey, 8, 15 * 60 * 1000);
      recordFailure(ipFailKey, 20, 15 * 60 * 1000);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    clearFailures(emailFailKey);
    clearFailures(ipFailKey);

    const token = await signToken({
      id: user.id,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          active: user.active,
          permissions: user.permissions,
        },
      },
      { status: 200 },
    );

    const requestUrl = new URL(request.url);
    const isHttps = requestUrl.protocol === "https:";
    const isLocalhost = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
    const shouldUseSecureCookie = process.env.NODE_ENV === "production" && isHttps && !isLocalhost;

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: shouldUseSecureCookie,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "An error occurred during login." }, { status: 500 });
  }
}
