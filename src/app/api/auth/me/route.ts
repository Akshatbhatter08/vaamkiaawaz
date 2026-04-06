import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authPayload = await requireAuth(request);
    if (authPayload instanceof NextResponse) return authPayload;

    const user = await prisma.user.findUnique({
      where: { id: authPayload.id as string },
      select: { id: true, email: true, role: true, permissions: true, active: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
