import { NextRequest, NextResponse } from "next/server";
import { requireUser, isMasterAdmin } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;
  if (!isMasterAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let connectionResult = "NOT TESTED";
  try {
    const result = await prisma.$queryRawUnsafe<{ test: number }[]>("SELECT 1 as test");
    connectionResult = `SUCCESS - got ${result.length} row(s)`;
  } catch (error) {
    console.error("GET /api/debug connection error:", error);
    connectionResult = "FAILED";
  }

  return NextResponse.json({
    connectionTest: connectionResult,
    nodeEnv: process.env.NODE_ENV || "NOT SET",
  });
}
