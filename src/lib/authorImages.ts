import { prisma } from "./prisma";
import { formatAuthorDisplayName, parsePenNameFromPermissions } from "./penName";

const MASTER_ADMIN_AUTHOR_NAME = "केशव कुमार भट्टड़ ";

const normalizeAuthorName = (name: string) => name.trim().toLowerCase();

export async function buildAuthorImageMap(): Promise<Map<string, string>> {
  const users = await prisma.user.findMany({
    select: { role: true, permissions: true },
  });

  const map = new Map<string, string>();

  for (const user of users) {
    let permissions: Record<string, unknown> = {};
    try {
      permissions =
        typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : ((user.permissions ?? {}) as Record<string, unknown>);
    } catch {
      permissions = {};
    }

    const canUseMasterAdminAsAuthor = user.role === "MASTER_ADMIN";
    const canUseAdminAsAuthor = user.role === "ADMIN" && permissions.publishBlog === true;
    const canUseContributorAsAuthor = user.role === "CONTRIBUTOR";

    if (!canUseMasterAdminAsAuthor && !canUseAdminAsAuthor && !canUseContributorAsAuthor) {
      continue;
    }

    const storedName = typeof permissions.authorName === "string" ? permissions.authorName.trim() : "";
    const rawName = storedName || (canUseMasterAdminAsAuthor ? MASTER_ADMIN_AUTHOR_NAME : "");
    if (!rawName) continue;

    const penSettings = parsePenNameFromPermissions(permissions);
    const displayName = formatAuthorDisplayName(rawName, penSettings);
    const rawImage = typeof permissions.authorImage === "string" ? permissions.authorImage.trim() : "";
    if (!rawImage) continue;

    const key = normalizeAuthorName(displayName);
    if (!map.has(key)) {
      map.set(key, rawImage);
    }
  }

  return map;
}

export function resolveAuthorImage(
  author: string,
  storedImage: string | null | undefined,
  authorMap: Map<string, string>,
): string | null {
  if (storedImage) return storedImage;
  return authorMap.get(normalizeAuthorName(author)) ?? null;
}

export async function enrichPostsWithAuthorImages<T extends { author: string; authorImage: string | null }>(
  posts: T[],
): Promise<T[]> {
  if (posts.length === 0) return posts;
  const authorMap = await buildAuthorImageMap();
  return posts.map((post) => ({
    ...post,
    authorImage: resolveAuthorImage(post.author, post.authorImage, authorMap),
  }));
}
