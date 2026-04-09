import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AuthorRecord = {
  name: string;
  image: string | null;
};

const normalizeAuthorName = (name: string) => name.trim().toLowerCase();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        active: true,
        permissions: true,
      },
    });

    const authorMap = new Map<string, AuthorRecord>();

    users.forEach((user) => {
      const permissions = (user.permissions ?? {}) as Record<string, unknown>;
      const canUseAdminAsAuthor = user.role === "ADMIN" && permissions.publishBlog === true;
      const canUseContributorAsAuthor = user.role === "CONTRIBUTOR";

      if (!canUseAdminAsAuthor && !canUseContributorAsAuthor) {
        return;
      }

      const fallbackName = typeof user.email === "string" ? user.email.trim() : "";
      const rawName = typeof permissions.authorName === "string" ? permissions.authorName.trim() : fallbackName;
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
  } catch {
    return NextResponse.json({ error: "लेखक सूची लोड नहीं हो सकी।" }, { status: 500 });
  }
}
