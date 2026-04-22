import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AuthorRecord = {
  name: string;
  image: string | null;
};

const normalizeAuthorName = (name: string) => name.trim().toLowerCase();
const MASTER_ADMIN_AUTHOR_NAME = "केशव कुमार भट्टर";

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
      const permissions = (user.permissions ?? {}) as Record<string, unknown>;
      const canUseMasterAdminAsAuthor = user.role === "MASTER_ADMIN";
      const canUseAdminAsAuthor = user.role === "ADMIN" && permissions.publishBlog === true;
      const canUseContributorAsAuthor = user.role === "CONTRIBUTOR";

      if (!canUseMasterAdminAsAuthor && !canUseAdminAsAuthor && !canUseContributorAsAuthor) {
        return;
      }

      const storedName = typeof permissions.authorName === "string" ? permissions.authorName.trim() : "";
      const rawName = storedName || (canUseMasterAdminAsAuthor ? MASTER_ADMIN_AUTHOR_NAME : "");
      if (!rawName) {
        return;
      }
      const name = rawName;
      const rawImage = typeof permissions.authorImage === "string" ? permissions.authorImage.trim() : "";
      const image = rawImage || null;
      const key = normalizeAuthorName(name);
      const current = authorMap.get(key);

      if (!current || (!current.image && image)) {
        authorMap.set(key, { name, image });
      }
    });

    return NextResponse.json({
      authors: Array.from(authorMap.values()).sort((a, b) => a.name.localeCompare(b.name, "hi")),
    });
  } catch (error: any) {
    console.error("GET /api/authors error:", error);
    return NextResponse.json({ 
      error: "लेखक सूची लोड नहीं हो सकी।",
      details: error.message || String(error)
    }, { status: 500 });
  }
}
