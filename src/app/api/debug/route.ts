import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "NOT SET";
  
  // Mask the password for security but show structure
  let masked = dbUrl;
  try {
    const url = new URL(dbUrl);
    masked = `${url.protocol}//${url.username}:****@${url.hostname}:${url.port}${url.pathname}${url.search}`;
  } catch {
    masked = `INVALID URL FORMAT: ${dbUrl.substring(0, 30)}...`;
  }

  // Test actual database connection
  let connectionResult = "NOT TESTED";
  try {
    const result = await prisma.$queryRawUnsafe<any[]>("SELECT 1 as test");
    connectionResult = `SUCCESS - got ${result.length} row(s)`;
  } catch (error: any) {
    connectionResult = `FAILED: ${error.message}`;
  }

  return NextResponse.json({
    databaseUrl: masked,
    connectionTest: connectionResult,
    nodeEnv: process.env.NODE_ENV || "NOT SET",
    cwd: process.cwd(),
  });
}
