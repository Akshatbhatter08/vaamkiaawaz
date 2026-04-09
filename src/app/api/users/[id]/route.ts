import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const permissionKeys = ["manageHomepage", "publishBlog", "manageCategories", "manageNewsletter", "manageUsers"] as const;
type PermissionKey = (typeof permissionKeys)[number];

const sanitizePermissions = (input: unknown) =>
  permissionKeys.reduce<Record<PermissionKey, boolean>>(
    (acc, key) => {
      const value = (input as Record<string, unknown> | null | undefined)?.[key];
      acc[key] = value === true;
      return acc;
    },
    {
      manageHomepage: false,
      publishBlog: false,
      manageCategories: false,
      manageNewsletter: false,
      manageUsers: false,
    },
  );

const extractAuthorProfile = (input: unknown) => {
  const source = (input as Record<string, unknown> | null | undefined) ?? {};
  const authorName = typeof source.authorName === "string" ? source.authorName.trim() : "";
  const authorImage = typeof source.authorImage === "string" ? source.authorImage.trim() : "";
  return {
    authorName,
    authorImage,
  };
};

const getRequester = async (request: NextRequest) => {
  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) {
    return { errorResponse: authPayload };
  }

  const requesterId = authPayload.id as string | undefined;
  if (!requesterId) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { id: true, role: true, permissions: true },
  });

  if (!requester) {
    return { errorResponse: NextResponse.json({ error: "User not found." }, { status: 404 }) };
  }

  const requesterPermissions = (requester.permissions ?? {}) as Partial<Record<"manageUsers", boolean>>;
  return {
    requester,
    canManageUsers: requester.role === "MASTER_ADMIN" || (requester.role === "ADMIN" && requesterPermissions.manageUsers === true),
  };
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requesterResult = await getRequester(request);
  if (requesterResult.errorResponse) {
    return requesterResult.errorResponse;
  }

  const { requester, canManageUsers } = requesterResult;
  const { id } = await params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, active: true, permissions: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Target user not found." }, { status: 404 });
  }

  const body = (await request.json()) as {
    permissions?: unknown;
    active?: boolean;
    authorName?: unknown;
    authorImage?: unknown;
  };

  const data: { permissions?: Record<string, unknown>; active?: boolean } = {};

  const isSelfMasterAdminUpdate = target.role === "MASTER_ADMIN" && requester.id === target.id;
  if (target.role === "MASTER_ADMIN" && !isSelfMasterAdminUpdate) {
    return NextResponse.json({ error: "Master admin cannot be modified." }, { status: 403 });
  }

  if (body.permissions !== undefined) {
    if (requester.role !== "MASTER_ADMIN" || target.role !== "ADMIN") {
      return NextResponse.json({ error: "Only master admin can update admin permissions." }, { status: 403 });
    }
    const authorProfile = extractAuthorProfile(target.permissions);
    data.permissions = {
      ...sanitizePermissions(body.permissions),
      ...(authorProfile.authorName ? { authorName: authorProfile.authorName } : {}),
      ...(authorProfile.authorImage ? { authorImage: authorProfile.authorImage } : {}),
    };
  }

  if (body.authorName !== undefined || body.authorImage !== undefined) {
    if (!isSelfMasterAdminUpdate) {
      return NextResponse.json({ error: "Only master admin can update own author profile." }, { status: 403 });
    }
    const nextAuthorName = typeof body.authorName === "string" ? body.authorName.trim() : "";
    const nextAuthorImage = typeof body.authorImage === "string" ? body.authorImage.trim() : "";
    if (!nextAuthorName) {
      return NextResponse.json({ error: "लेखक नाम आवश्यक है।" }, { status: 400 });
    }
    if (!nextAuthorImage) {
      return NextResponse.json({ error: "लेखक फोटो आवश्यक है।" }, { status: 400 });
    }
    if (!nextAuthorImage.startsWith("data:image/")) {
      return NextResponse.json({ error: "लेखक फोटो का फ़ॉर्मेट अमान्य है।" }, { status: 400 });
    }
    const basePermissions = ((data.permissions ?? target.permissions ?? {}) as Record<string, unknown>) ?? {};
    data.permissions = {
      ...basePermissions,
      authorName: nextAuthorName,
      authorImage: nextAuthorImage,
    };
  }

  if (body.active !== undefined) {
    if (target.role !== "CONTRIBUTOR") {
      return NextResponse.json({ error: "Active status can only be changed for contributors." }, { status: 400 });
    }
    if (!canManageUsers) {
      return NextResponse.json({ error: "You do not have permission to manage contributors." }, { status: 403 });
    }
    data.active = body.active === true;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid updates provided." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, role: true, active: true, permissions: true },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requesterResult = await getRequester(request);
  if (requesterResult.errorResponse) {
    return requesterResult.errorResponse;
  }

  const { requester, canManageUsers } = requesterResult;
  const { id } = await params;

  if (requester.id === id) {
    return NextResponse.json({ error: "You cannot remove your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Target user not found." }, { status: 404 });
  }

  if (target.role === "MASTER_ADMIN") {
    return NextResponse.json({ error: "Master admin cannot be removed." }, { status: 403 });
  }

  if (target.role === "ADMIN" && !canManageUsers) {
    return NextResponse.json({ error: "You do not have permission to remove admins." }, { status: 403 });
  }

  if (target.role === "CONTRIBUTOR" && !canManageUsers) {
    return NextResponse.json({ error: "You do not have permission to remove contributors." }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
