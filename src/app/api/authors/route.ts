import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAuthorListName } from "@/lib/penName";

export const dynamic = "force-dynamic";

type AuthorRecord = {
  name: string;
  image: string | null;
};

const normalizeAuthorName = (name: string) => name.trim().toLowerCase();
const MASTER_ADMIN_AUTHOR_NAME = "केशव कुमार भट्टड़ ";

export async function GET() {
  try {
    // Basic check for User table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`User\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`passwordHash\` VARCHAR(191) NOT NULL,
        \`role\` ENUM('MASTER_ADMIN', 'ADMIN', 'CONTRIBUTOR') NOT NULL DEFAULT 'CONTRIBUTOR',
        \`active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`permissions\` JSON NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        UNIQUE INDEX \`User_email_key\`(\`email\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        active: true,
        permissions: true,
      },
    });

    const authorMap = new Map<string, AuthorRecord>();
    // ... existing mapping logic ...
    users.forEach((user) => {
      let permissions: Record<string, unknown> = {};
      try {
        permissions = typeof user.permissions === "string" ? JSON.parse(user.permissions) : (user.permissions ?? {}) as Record<string, unknown>;
      } catch { permissions = {}; }
      const canUseMasterAdminAsAuthor = user.role === "MASTER_ADMIN";
      const canUseAdminAsAuthor = user.role === "ADMIN" && permissions.publishBlog === true;
      const canUseContributorAsAuthor = user.role === "CONTRIBUTOR" && user.active;

      if (!canUseMasterAdminAsAuthor && !canUseAdminAsAuthor && !canUseContributorAsAuthor) {
        return;
      }

      const displayName = resolveAuthorListName(
        permissions,
        canUseMasterAdminAsAuthor ? MASTER_ADMIN_AUTHOR_NAME : "",
      );
      if (!displayName) {
        return;
      }
      const rawImage = typeof permissions.authorImage === "string" ? permissions.authorImage.trim() : "";
      const image = rawImage || null;
      const key = normalizeAuthorName(displayName);
      const current = authorMap.get(key);

      if (!current || (!current.image && image)) {
        authorMap.set(key, { name: displayName, image });
      }
    });

    return NextResponse.json({
      authors: Array.from(authorMap.values()).sort((a, b) => a.name.localeCompare(b.name, "hi")),
    });
  } catch (error) {
    console.error("GET /api/authors error:", error);
    return NextResponse.json({ 
      error: "लेखक सूची लोड नहीं हो सकी।",
    }, { status: 500 });
  }
}
