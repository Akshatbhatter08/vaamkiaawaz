import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { parseUserPermissions } from "@/lib/contributorCode";

export type DbUser = {
  id: string;
  role: "MASTER_ADMIN" | "ADMIN" | "CONTRIBUTOR";
  active: boolean;
  permissions: Record<string, unknown>;
};

/**
 * Authenticate via JWT cookie, then reload the current user from DB.
 * JWT role alone must never grant elevated access after demotion/deactivation.
 */
export async function requireUser(
  request: NextRequest,
): Promise<DbUser | NextResponse> {
  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) return authPayload;

  const userId = authPayload.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, active: true, permissions: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.active) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return {
    id: user.id,
    role: user.role,
    active: user.active,
    permissions: parseUserPermissions(user.permissions),
  };
}

export function isMasterAdmin(user: DbUser): boolean {
  return user.role === "MASTER_ADMIN";
}

export function canManageCategories(user: DbUser): boolean {
  return (
    user.role === "MASTER_ADMIN" ||
    (user.role === "ADMIN" && user.permissions.manageCategories === true)
  );
}

export function canPublishContent(user: DbUser): boolean {
  return (
    user.role === "MASTER_ADMIN" ||
    (user.role === "ADMIN" && user.permissions.publishBlog === true) ||
    user.role === "CONTRIBUTOR"
  );
}

export function canManageUsers(user: DbUser): boolean {
  return (
    user.role === "MASTER_ADMIN" ||
    (user.role === "ADMIN" && user.permissions.manageUsers === true)
  );
}
