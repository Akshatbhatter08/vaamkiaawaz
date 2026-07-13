import { NextResponse, NextRequest } from "next/server";
import { requireUser, canManageUsers } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    if (!canManageUsers(user)) {
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
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
