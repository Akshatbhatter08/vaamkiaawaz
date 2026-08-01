/* Many-to-many link between BlogPost and StruggleTracker. Table self-creates on first access,
   matching the StruggleTracker / SavedArticle convention. */

import { prisma } from "./prisma";
import { ensureStruggleTrackerTable } from "./struggleTracker";

let ensureTablePromise: Promise<void> | null = null;

const createTable = async () => {
  await ensureStruggleTrackerTable();
  await prisma.$executeRawUnsafe(
    "CREATE TABLE IF NOT EXISTS `ArticleStruggleTag` (" +
      "`id` VARCHAR(191) NOT NULL," +
      "`blogPostId` VARCHAR(191) NOT NULL," +
      "`struggleTrackerId` VARCHAR(191) NOT NULL," +
      "`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)," +
      "INDEX `ArticleStruggleTag_blogPostId_idx`(`blogPostId`)," +
      "INDEX `ArticleStruggleTag_struggleTrackerId_idx`(`struggleTrackerId`)," +
      "UNIQUE INDEX `ArticleStruggleTag_blogPostId_struggleTrackerId_key`(`blogPostId`, `struggleTrackerId`)," +
      "PRIMARY KEY (`id`)," +
      "CONSTRAINT `ArticleStruggleTag_blogPostId_fkey` FOREIGN KEY (`blogPostId`) REFERENCES `BlogPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE," +
      "CONSTRAINT `ArticleStruggleTag_struggleTrackerId_fkey` FOREIGN KEY (`struggleTrackerId`) REFERENCES `StruggleTracker`(`id`) ON DELETE CASCADE ON UPDATE CASCADE" +
      ") DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
  );
};

export const ensureArticleStruggleTagTable = async () => {
  if (!ensureTablePromise) {
    ensureTablePromise = createTable()
      .then(() => undefined)
      .catch((error) => {
        ensureTablePromise = null;
        throw error;
      });
  }
  await ensureTablePromise;
};

const normalizeIds = (ids: unknown): string[] => {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0))];
};

export async function readArticleStruggleTagIds(blogPostId: string): Promise<string[]> {
  await ensureArticleStruggleTagTable();
  const rows = await prisma.articleStruggleTag.findMany({
    where: { blogPostId },
    select: { struggleTrackerId: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => row.struggleTrackerId);
}

export async function readBlogPostIdsForStruggleTracker(struggleTrackerId: string): Promise<string[]> {
  await ensureArticleStruggleTagTable();
  const rows = await prisma.articleStruggleTag.findMany({
    where: { struggleTrackerId },
    select: { blogPostId: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => row.blogPostId);
}

/** Diff-and-sync tags for a post. Pass undefined to leave tags unchanged. */
export async function syncArticleStruggleTags(
  blogPostId: string,
  struggleTrackerIds: unknown,
): Promise<string[] | null> {
  if (struggleTrackerIds === undefined) return null;

  await ensureArticleStruggleTagTable();

  const uniqueIds = normalizeIds(struggleTrackerIds);

  if (uniqueIds.length > 0) {
    const count = await prisma.struggleTracker.count({ where: { id: { in: uniqueIds } } });
    if (count !== uniqueIds.length) {
      throw new Error("अमान्य संघर्ष आंदोलन");
    }
  }

  const existing = await prisma.articleStruggleTag.findMany({
    where: { blogPostId },
    select: { struggleTrackerId: true },
  });
  const existingIds = new Set(existing.map((row) => row.struggleTrackerId));
  const nextIds = new Set(uniqueIds);

  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));
  const toAdd = uniqueIds.filter((id) => !existingIds.has(id));

  if (toRemove.length > 0) {
    await prisma.articleStruggleTag.deleteMany({
      where: { blogPostId, struggleTrackerId: { in: toRemove } },
    });
  }

  if (toAdd.length > 0) {
    await prisma.articleStruggleTag.createMany({
      data: toAdd.map((struggleTrackerId) => ({ blogPostId, struggleTrackerId })),
      skipDuplicates: true,
    });
  }

  return uniqueIds;
}
