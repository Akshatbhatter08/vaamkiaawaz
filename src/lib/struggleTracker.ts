/* सक्रिय संघर्ष ट्रैकर storage. The rows used to be a hardcoded array in ClientPage.tsx; they now
   live in the StruggleTracker table and are managed by the master admin. */

import { prisma } from "./prisma";
import {
  isStruggleStatus,
  parseSinceMonth,
  struggleStatusLabel,
  type StruggleStatus,
  type StruggleTrackerEntry,
} from "./struggleTrackerShared";

export {
  STRUGGLE_STATUSES,
  isStruggleStatus,
  parseSinceMonth,
  struggleStatusLabel,
  type StruggleStatus,
  type StruggleTrackerEntry,
} from "./struggleTrackerShared";

type StruggleTrackerRow = {
  id: string;
  name: string;
  status: string;
  location: string;
  description: string;
  sinceDate: Date;
  displayOrder: number;
  isActive: boolean;
};

const toSinceMonth = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

/* Stored as a real date but always shown as month + year, which is what the hardcoded strings
   ("नवंबर 2024") were. UTC keeps the month from slipping on servers behind GMT. */
const toStartDateLabel = (date: Date): string =>
  date.toLocaleDateString("hi-IN", { month: "long", year: "numeric", timeZone: "UTC" });

export const toStruggleTrackerEntry = (row: StruggleTrackerRow): StruggleTrackerEntry => {
  const status = isStruggleStatus(row.status) ? row.status : "active";
  const sinceDate = row.sinceDate instanceof Date ? row.sinceDate : new Date(row.sinceDate);
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    startDate: toStartDateLabel(sinceDate),
    sinceMonth: toSinceMonth(sinceDate),
    description: row.description,
    status,
    statusLabel: struggleStatusLabel(status),
    displayOrder: row.displayOrder,
    isActive: row.isActive,
  };
};

/* The four rows that were hardcoded in ClientPage.tsx, seeded once on first access so the
   homepage section does not go blank the moment it starts reading from the database. */
const INITIAL_SEED: { name: string; location: string; sinceMonth: string; description: string; status: StruggleStatus }[] = [
  {
    name: "किसान आंदोलन",
    location: "दिल्ली सीमा",
    sinceMonth: "2024-11",
    description: "न्यूनतम समर्थन मूल्य की कानूनी गारंटी की मांग जारी।",
    status: "active",
  },
  {
    name: "आशा कर्मी हड़ताल",
    location: "महाराष्ट्र",
    sinceMonth: "2026-01",
    description: "वेतन और स्थायीकरण को लेकर राज्यव्यापी हड़ताल।",
    status: "strike",
  },
  {
    name: "मनरेगा मज़दूर मोर्चा",
    location: "झारखंड",
    sinceMonth: "2026-03",
    description: "बकाया भुगतान और कार्यदिवस बढ़ाने की माँग।",
    status: "active",
  },
  {
    name: "शिक्षक भर्ती संघर्ष",
    location: "उत्तर प्रदेश",
    sinceMonth: "2025-12",
    description: "लंबित नियुक्तियों पर अदालती फैसले के बाद आंशिक जीत।",
    status: "success",
  },
];

let ensureTablePromise: Promise<void> | null = null;

/* Created here as well as in the Prisma schema so an existing deployment picks the table up on
   first access, the same way ensureSiteConfigTable handles SiteConfig. */
const createTableAndSeed = async () => {
  await prisma.$executeRawUnsafe(
    "CREATE TABLE IF NOT EXISTS `StruggleTracker` (" +
      "`id` VARCHAR(191) NOT NULL," +
      "`name` VARCHAR(191) NOT NULL," +
      "`status` VARCHAR(32) NOT NULL," +
      "`location` VARCHAR(191) NOT NULL," +
      "`description` TEXT NOT NULL," +
      "`sinceDate` DATETIME(3) NOT NULL," +
      "`displayOrder` INTEGER NOT NULL DEFAULT 0," +
      "`isActive` BOOLEAN NOT NULL DEFAULT TRUE," +
      "`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)," +
      "`updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)," +
      "INDEX `StruggleTracker_isActive_displayOrder_idx`(`isActive`, `displayOrder`)," +
      "PRIMARY KEY (`id`)" +
      ") DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
  );

  const existing = await prisma.$queryRawUnsafe<{ total: bigint | number }[]>(
    "SELECT COUNT(*) AS total FROM `StruggleTracker`",
  );
  if (Number(existing[0]?.total ?? 0) > 0) return;

  for (const [index, seed] of INITIAL_SEED.entries()) {
    await prisma.$executeRawUnsafe(
      "INSERT INTO `StruggleTracker` " +
        "(`id`, `name`, `status`, `location`, `description`, `sinceDate`, `displayOrder`, `isActive`) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)",
      `seed-struggle-${index + 1}`,
      seed.name,
      seed.status,
      seed.location,
      seed.description,
      parseSinceMonth(seed.sinceMonth),
      index,
    );
  }
};

export const ensureStruggleTrackerTable = async () => {
  if (!ensureTablePromise) {
    ensureTablePromise = createTableAndSeed()
      .then(() => undefined)
      .catch((error) => {
        ensureTablePromise = null;
        throw error;
      });
  }
  await ensureTablePromise;
};

export async function readStruggleTrackerEntries(
  options: { includeInactive?: boolean } = {},
): Promise<StruggleTrackerEntry[]> {
  try {
    await ensureStruggleTrackerTable();
    const rows = await prisma.struggleTracker.findMany({
      where: options.includeInactive ? undefined : { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(toStruggleTrackerEntry);
  } catch (error) {
    console.error("readStruggleTrackerEntries failed:", error);
    return [];
  }
}
