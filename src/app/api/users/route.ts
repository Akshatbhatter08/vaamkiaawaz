import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authPayload = await requireAuth(request);
    if (authPayload instanceof NextResponse) return authPayload;
    const requesterId = authPayload.id as string | undefined;
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true, permissions: true },
    });

    if (!requester) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const requesterPermissions = (requester.permissions ?? {}) as Partial<Record<"manageUsers", boolean>>;
    const canAccessUsers =
      requester.role === "MASTER_ADMIN" ||
      (requester.role === "ADMIN" && requesterPermissions.manageUsers === true);

    if (!canAccessUsers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        permissions: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
