import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const permissionKeys = ["manageHomepage", "publishBlog", "manageCategories", "manageNewsletter", "manageUsers"] as const;
type PermissionKey = (typeof permissionKeys)[number];
const MASTER_ADMIN_AUTHOR_NAME = "केशव कुमार भट्टर";

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

const extractAuthorName = (input: unknown) => {
  const value = typeof input === "string" ? input.trim() : "";
  return value;
};

const extractAuthorImage = (input: unknown) => {
  const value = typeof input === "string" ? input.trim() : "";
  return value;
};

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (requester.role !== "MASTER_ADMIN" && requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can add new users." }, { status: 403 });
    }

    const { email, password, role, permissions, authorName, authorImage } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Email, password, and role are required." }, { status: 400 });
    }

    if (role !== "MASTER_ADMIN" && role !== "ADMIN" && role !== "CONTRIBUTOR") {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const requesterPermissions = (requester.permissions ?? {}) as Partial<Record<"manageUsers", boolean>>;
    const requesterCanManageUsers =
      requester.role === "MASTER_ADMIN" || (requester.role === "ADMIN" && requesterPermissions.manageUsers === true);

    if (role === "MASTER_ADMIN" && requester.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Only MASTER_ADMIN can create another master admin." }, { status: 403 });
    }

    if ((role === "ADMIN" || role === "CONTRIBUTOR") && !requesterCanManageUsers) {
      return NextResponse.json({ error: "You do not have permission to add this user role." }, { status: 403 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const sanitizedPermissions = role === "ADMIN" ? sanitizePermissions(permissions) : undefined;
    const normalizedAuthorName = extractAuthorName(authorName);
    const normalizedAuthorImage = extractAuthorImage(authorImage);

    if (normalizedAuthorImage && !normalizedAuthorImage.startsWith("data:image/")) {
      return NextResponse.json({ error: "लेखक फोटो का फ़ॉर्मेट अमान्य है।" }, { status: 400 });
    }

    const shouldSetAuthorProfile =
      role === "CONTRIBUTOR" || (role === "ADMIN" && sanitizedPermissions?.publishBlog === true);

    if (role === "ADMIN" && !normalizedAuthorName) {
      return NextResponse.json({ error: "एडमिन के लिए नाम आवश्यक है।" }, { status: 400 });
    }

    if (shouldSetAuthorProfile && (!normalizedAuthorName || !normalizedAuthorImage)) {
      return NextResponse.json({ error: "लेखक नाम और लेखक फोटो आवश्यक हैं।" }, { status: 400 });
    }

    const storedPermissions =
      role === "ADMIN"
        ? {
            ...sanitizedPermissions,
            ...(normalizedAuthorName ? { authorName: normalizedAuthorName } : {}),
            ...(shouldSetAuthorProfile ? { authorImage: normalizedAuthorImage } : {}),
          }
        : role === "CONTRIBUTOR"
          ? {
              authorName: normalizedAuthorName,
              authorImage: normalizedAuthorImage,
            }
          : {
              authorName: normalizedAuthorName || MASTER_ADMIN_AUTHOR_NAME,
              ...(normalizedAuthorImage ? { authorImage: normalizedAuthorImage } : {}),
            };

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role,
        permissions: storedPermissions,
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully!",
        user: { id: user.id, email: user.email, role: user.role, active: user.active, permissions: user.permissions },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "An error occurred during registration." }, { status: 500 });
  }
}
