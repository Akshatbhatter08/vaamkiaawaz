import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const MIN_JWT_SECRET_LENGTH = 32;

function resolveJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET is missing or too weak (requires ${MIN_JWT_SECRET_LENGTH}+ characters). Refusing to sign/verify tokens.`,
    );
  }
  return new TextEncoder().encode(secret);
}

let cachedKey: Uint8Array | null = null;
function getKey(): Uint8Array {
  if (!cachedKey) cachedKey = resolveJwtSecret();
  return cachedKey;
}

export async function signToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getKey());
}

/** Short-lived proof that an email completed OTP for a given purpose. */
export async function signOtpProof(payload: { email: string; purpose: string }) {
  return await new SignJWT({
    email: payload.email.toLowerCase(),
    purpose: payload.purpose,
    typ: "otp_proof",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getKey());
}

export async function verifyOtpProof(
  token: string,
  expected: { email: string; purpose: string },
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    if (payload.typ !== "otp_proof") return false;
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    const purpose = typeof payload.purpose === "string" ? payload.purpose : "";
    return (
      email === expected.email.trim().toLowerCase() && purpose === expected.purpose
    );
  } catch {
    return false;
  }
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getKey());
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function requireAuth(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  return payload;
}
