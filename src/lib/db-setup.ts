import { prisma } from "./prisma";
import { initialBlogSeed } from "./blog-seed";

type BlogColumnMeta = {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: "YES" | "NO";
};

let ensureBlogSchemaPromise: Promise<void> | null = null;

const ensureBlogPostStorageColumns = async () => {
  const columns = await prisma.$queryRawUnsafe<BlogColumnMeta[]>(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'BlogPost'
      AND COLUMN_NAME IN ('title', 'excerpt', 'content', 'postImage', 'imageFocus', 'authorImage', 'uploaderName', 'isHidden', 'likeCount', 'dislikeCount')
  `);

  const byName = new Map(columns.map((item) => [item.COLUMN_NAME, item]));
  const title = byName.get("title");
  const excerpt = byName.get("excerpt");
  const content = byName.get("content");
  const postImage = byName.get("postImage");
  const imageFocus = byName.get("imageFocus");
  const authorImage = byName.get("authorImage");
  const uploaderName = byName.get("uploaderName");
  const isHidden = byName.get("isHidden");
  const likeCount = byName.get("likeCount");
  const dislikeCount = byName.get("dislikeCount");

  if (!title || !excerpt || !content) {
    const tableExists = await prisma.$queryRawUnsafe<{ COUNT: number }[]>(`
      SELECT COUNT(*) as COUNT
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'BlogPost'
    `);
    
    if (tableExists[0]?.COUNT === 0) {
      console.log("BlogPost table missing, creating...");
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

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`BlogPost\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`category\` VARCHAR(191) NOT NULL,
          \`title\` TEXT NOT NULL,
          \`excerpt\` TEXT NOT NULL,
          \`content\` LONGTEXT NOT NULL,
          \`author\` VARCHAR(191) NOT NULL,
          \`clickCount\` INTEGER NOT NULL DEFAULT 0,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL,
          \`postImage\` LONGTEXT NULL,
          \`imageFocus\` VARCHAR(32) NULL,
          \`authorImage\` LONGTEXT NULL,
          \`authorUserId\` VARCHAR(191) NULL,
          \`uploaderName\` VARCHAR(191) NULL,
          \`isHidden\` BOOLEAN NOT NULL DEFAULT FALSE,
          PRIMARY KEY (\`id\`),
          CONSTRAINT \`BlogPost_authorUserId_fkey\` FOREIGN KEY (\`authorUserId\`) REFERENCES \`User\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      `);

      const count = await prisma.blogPost.count().catch(() => 0);
      if (count === 0) {
        await prisma.blogPost.createMany({
          data: initialBlogSeed.map((post) => ({
            category: post.category,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            author: post.author,
          })),
        }).catch(console.error);
      }
      return; 
    }
  }

  const textTypes = new Set(["text", "mediumtext", "longtext"]);
  const alterOps: string[] = [];

  if (title && (!textTypes.has(title.DATA_TYPE.toLowerCase()) || title.IS_NULLABLE !== "NO")) {
    alterOps.push("MODIFY `title` TEXT NOT NULL");
  }

  if (excerpt && (!textTypes.has(excerpt.DATA_TYPE.toLowerCase()) || excerpt.IS_NULLABLE !== "NO")) {
    alterOps.push("MODIFY `excerpt` TEXT NOT NULL");
  }

  if (content && (content.DATA_TYPE.toLowerCase() !== "longtext" || content.IS_NULLABLE !== "NO")) {
    alterOps.push("MODIFY `content` LONGTEXT NOT NULL");
  }

  if (!postImage) {
    alterOps.push("ADD COLUMN `postImage` LONGTEXT NULL");
  } else if (postImage.DATA_TYPE.toLowerCase() !== "longtext") {
    alterOps.push("MODIFY `postImage` LONGTEXT NULL");
  }

  if (!imageFocus) {
    alterOps.push("ADD COLUMN `imageFocus` VARCHAR(32) NULL");
  }

  if (!authorImage) {
    alterOps.push("ADD COLUMN `authorImage` LONGTEXT NULL");
  } else if (authorImage.DATA_TYPE.toLowerCase() !== "longtext") {
    alterOps.push("MODIFY `authorImage` LONGTEXT NULL");
  }

  if (!uploaderName) {
    alterOps.push("ADD COLUMN `uploaderName` VARCHAR(191) NULL");
  }

  if (!isHidden) {
    alterOps.push("ADD COLUMN `isHidden` BOOLEAN NOT NULL DEFAULT FALSE");
  }

  if (!likeCount) {
    alterOps.push("ADD COLUMN `likeCount` INTEGER NOT NULL DEFAULT 0");
  }

  if (!dislikeCount) {
    alterOps.push("ADD COLUMN `dislikeCount` INTEGER NOT NULL DEFAULT 0");
  }

  if (alterOps.length > 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`BlogPost\` ${alterOps.join(", ")}`);
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`Category\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`isHidden\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE INDEX \`Category_name_key\`(\`name\`),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`ArticleComment\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`blogPostId\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`email\` VARCHAR(191) NOT NULL,
      \`comment\` TEXT NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX \`ArticleComment_blogPostId_idx\`(\`blogPostId\`),
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`ArticleComment_blogPostId_fkey\` FOREIGN KEY (\`blogPostId\`) REFERENCES \`BlogPost\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`ArticleReaction\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`blogPostId\` VARCHAR(191) NOT NULL,
      \`visitorId\` VARCHAR(191) NOT NULL,
      \`reaction\` VARCHAR(191) NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX \`ArticleReaction_blogPostId_idx\`(\`blogPostId\`),
      UNIQUE INDEX \`ArticleReaction_blogPostId_visitorId_key\`(\`blogPostId\`, \`visitorId\`),
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`ArticleReaction_blogPostId_fkey\` FOREIGN KEY (\`blogPostId\`) REFERENCES \`BlogPost\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);
};

/**
 * Ensures BlogPost / engagement tables exist.
 * Runs once per process (singleton). Prefer `npx prisma db push` at deploy (see .env.example).
 * Kept for Hostinger first-boot compatibility — not intended as ongoing DDL on every request.
 */
export const ensureBlogSchema = async () => {
  if (!ensureBlogSchemaPromise) {
    ensureBlogSchemaPromise = ensureBlogPostStorageColumns().catch((error) => {
      ensureBlogSchemaPromise = null;
      throw error;
    });
  }
  await ensureBlogSchemaPromise;
};
