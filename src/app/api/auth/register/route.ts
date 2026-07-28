import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpProof } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { isValidImageRef } from "@/lib/fileStorage";
import { generateContributorCode } from "@/lib/contributorCode";
import { validatePasswordStrength } from "@/lib/tiptapSanitize";
import { canManageUsers, requireUser } from "@/lib/requireUser";

const permissionKeys = ["manageHomepage", "publishBlog", "manageCategories", "manageNewsletter", "manageUsers"] as const;
type PermissionKey = (typeof permissionKeys)[number];
const MASTER_ADMIN_AUTHOR_NAME = "केशव कुमार भट्टड़ ";

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

const looksLikeEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    if (!canManageUsers(user)) {
      return NextResponse.json({ error: "Only admins can add new users." }, { status: 403 });
    }

    const { email, password, role, permissions, authorName, authorImage, otpProof } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Email, password, and role are required." }, { status: 400 });
    }

    if (role !== "MASTER_ADMIN" && role !== "ADMIN" && role !== "CONTRIBUTOR") {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const passwordError = validatePasswordStrength(String(password));
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    if (role === "MASTER_ADMIN" && user.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Only MASTER_ADMIN can create another master admin." }, { status: 403 });
    }

    if ((role === "ADMIN" || role === "CONTRIBUTOR") && !canManageUsers(user)) {
      return NextResponse.json({ error: "You do not have permission to add this user role." }, { status: 403 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // S-22: email registrations require OTP proof; MASTER_ADMIN username fallbacks may skip.
    if (looksLikeEmail(normalizedEmail)) {
      const proof = typeof otpProof === "string" ? otpProof : "";
      const ok = await verifyOtpProof(proof, { email: normalizedEmail, purpose: "register" });
      if (!ok) {
        return NextResponse.json({ error: "Email OTP verification required." }, { status: 403 });
      }
    } else if (user.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Valid email or OTP proof required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const sanitizedPermissions = role === "ADMIN" ? sanitizePermissions(permissions) : undefined;
    const normalizedAuthorName = extractAuthorName(authorName);
    const normalizedAuthorImage = extractAuthorImage(authorImage);

    if (normalizedAuthorImage && !isValidImageRef(normalizedAuthorImage)) {
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
            ...((sanitizedPermissions?.publishBlog || shouldSetAuthorProfile)
              ? { contributorCode: generateContributorCode() }
              : {}),
          }
        : role === "CONTRIBUTOR"
          ? {
              authorName: normalizedAuthorName,
              authorImage: normalizedAuthorImage,
              contributorCode: generateContributorCode(),
            }
          : {
              authorName: normalizedAuthorName || MASTER_ADMIN_AUTHOR_NAME,
              ...(normalizedAuthorImage ? { authorImage: normalizedAuthorImage } : {}),
              contributorCode: generateContributorCode(),
            };

    const passwordHash = await hashPassword(password);
    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role,
        permissions: JSON.stringify(storedPermissions),
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully!",
        user: { id: created.id, email: created.email, role: created.role, active: created.active, permissions: created.permissions },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json({ error: "An error occurred during registration." }, { status: 500 });
  }
}
