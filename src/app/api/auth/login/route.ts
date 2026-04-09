import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      active: user.active,
      permissions: user.permissions,
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
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "An error occurred during login." }, { status: 500 });
  }
}
