/**
 * Verify engagement tables/columns on the configured DATABASE_URL.
 * Safe to run: only uses CREATE TABLE IF NOT EXISTS / ADD COLUMN IF missing via ensureBlogSchema.
 *
 * Usage: npx tsx scripts/verify-engagement-schema.ts
 */
import { prisma } from "../src/lib/prisma";
import { ensureBlogSchema } from "../src/lib/db-setup";

type TableRow = { TABLE_NAME: string };

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<TableRow[]>(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    name,
  );
  return rows.length > 0;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ COLUMN_NAME: string }[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    table,
    column,
  );
  return rows.length > 0;
}

async function main() {
  console.log("==> Ensuring schema (idempotent, safe)...");
  await ensureBlogSchema();

  const checks = [
    { label: "ArticleComment table", ok: await tableExists("ArticleComment") },
    { label: "ArticleReaction table", ok: await tableExists("ArticleReaction") },
    { label: "BlogPost.likeCount column", ok: await columnExists("BlogPost", "likeCount") },
    { label: "BlogPost.dislikeCount column", ok: await columnExists("BlogPost", "dislikeCount") },
  ];

  console.log("\n==> Schema checks:");
  let allOk = true;
  for (const c of checks) {
    console.log(`${c.ok ? "OK" : "MISSING"}: ${c.label}`);
    if (!c.ok) allOk = false;
  }

  const [commentCount, reactionCount, postsWithLikes] = await Promise.all([
    prisma.articleComment.count().catch(() => -1),
    prisma.articleReaction.count().catch(() => -1),
    prisma.blogPost.count({ where: { likeCount: { gt: 0 } } }).catch(() => -1),
  ]);

  console.log("\n==> Live data:");
  console.log(`comments: ${commentCount}`);
  console.log(`reactions: ${reactionCount}`);
  console.log(`posts with likes: ${postsWithLikes}`);

  if (!allOk) {
    console.error("\nERROR: Some schema objects are still missing.");
    process.exit(1);
  }

  console.log("\nOK: Engagement schema is present and ready.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
