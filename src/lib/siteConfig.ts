import fs from "fs/promises";
import path from "path";
import { prisma } from "./prisma";

export type SiteConfig = {
  featuredVicharPostIds: string[];
};

const DEFAULT_CONFIG: SiteConfig = {
  featuredVicharPostIds: [],
};

const FEATURED_VICHAR_KEY = "featuredVicharPostIds";

let ensureTablePromise: Promise<void> | null = null;

/* Created here rather than only in the Prisma schema so an existing deployment picks the table
   up on first read, the same way ensureBlogSchema handles the article tables. */
const ensureSiteConfigTable = async () => {
  if (!ensureTablePromise) {
    ensureTablePromise = prisma
      .$executeRawUnsafe(
        "CREATE TABLE IF NOT EXISTS `SiteConfig` (" +
          "`id` VARCHAR(191) NOT NULL," +
          "`value` LONGTEXT NOT NULL," +
          "`updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)," +
          "PRIMARY KEY (`id`)" +
          ") DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
      )
      .then(() => undefined)
      .catch((error) => {
        ensureTablePromise = null;
        throw error;
      });
  }
  await ensureTablePromise;
};

const parseIds = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
};

function getLegacyConfigPath(): string {
  return path.join(process.cwd(), "data", "site-config.json");
}

/* The selection used to live in <cwd>/data/site-config.json. That file is written into the
   running instance's own filesystem, so it disappeared on every redeploy and was invisible to
   any other instance — which is why the admin's selection kept reverting to "none selected".
   Read once here so a selection still sitting in that file is carried into the database. */
async function readLegacySelection(): Promise<string[]> {
  try {
    const raw = await fs.readFile(getLegacyConfigPath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    return Array.isArray(parsed.featuredVicharPostIds)
      ? parsed.featuredVicharPostIds.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export async function readSiteConfig(): Promise<SiteConfig> {
  try {
    await ensureSiteConfigTable();
    const rows = await prisma.$queryRawUnsafe<{ value: string }[]>(
      "SELECT `value` FROM `SiteConfig` WHERE `id` = ?",
      FEATURED_VICHAR_KEY,
    );

    if (rows.length > 0) {
      return { featuredVicharPostIds: parseIds(rows[0].value) };
    }

    const legacy = await readLegacySelection();
    if (legacy.length > 0) {
      await writeSiteConfig({ featuredVicharPostIds: legacy });
      return { featuredVicharPostIds: legacy };
    }

    return { ...DEFAULT_CONFIG };
  } catch (error) {
    console.error("readSiteConfig failed:", error);
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeSiteConfig(config: SiteConfig): Promise<void> {
  await ensureSiteConfigTable();
  await prisma.$executeRawUnsafe(
    "INSERT INTO `SiteConfig` (`id`, `value`, `updatedAt`) VALUES (?, ?, NOW(3)) " +
      "ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updatedAt` = NOW(3)",
    FEATURED_VICHAR_KEY,
    JSON.stringify(config.featuredVicharPostIds),
  );
}
