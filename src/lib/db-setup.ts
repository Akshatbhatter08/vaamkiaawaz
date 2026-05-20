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
      AND COLUMN_NAME IN ('title', 'excerpt', 'content', 'postImage', 'authorImage', 'uploaderName')
  `);

  const byName = new Map(columns.map((item) => [item.COLUMN_NAME, item]));
  const title = byName.get("title");
  const excerpt = byName.get("excerpt");
  const content = byName.get("content");
  const postImage = byName.get("postImage");
  const authorImage = byName.get("authorImage");
  const uploaderName = byName.get("uploaderName");

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
          \`authorImage\` LONGTEXT NULL,
          \`authorUserId\` VARCHAR(191) NULL,
          \`uploaderName\` VARCHAR(191) NULL,
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

  if (!authorImage) {
    alterOps.push("ADD COLUMN `authorImage` LONGTEXT NULL");
  } else if (authorImage.DATA_TYPE.toLowerCase() !== "longtext") {
    alterOps.push("MODIFY `authorImage` LONGTEXT NULL");
  }

  if (!uploaderName) {
    alterOps.push("ADD COLUMN `uploaderName` VARCHAR(191) NULL");
  }

  if (alterOps.length > 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`BlogPost\` ${alterOps.join(", ")}`);
  }
};

export const ensureBlogSchema = async () => {
  if (!ensureBlogSchemaPromise) {
    ensureBlogSchemaPromise = ensureBlogPostStorageColumns().catch((error) => {
      ensureBlogSchemaPromise = null;
      throw error;
    });
  }
  await ensureBlogSchemaPromise;
};
