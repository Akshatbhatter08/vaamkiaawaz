import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  const requestUrl = new URL(request.url);
  const isHttps = requestUrl.protocol === "https:";
  const isLocalhost = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  const shouldUseSecureCookie = process.env.NODE_ENV === "production" && isHttps && !isLocalhost;

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: shouldUseSecureCookie,
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
