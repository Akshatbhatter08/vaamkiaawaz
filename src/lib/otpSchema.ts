import { prisma } from "@/lib/prisma";

export const ensureOtpSchema = async () => {
  const tableCheck = await prisma.$queryRawUnsafe<{ count: number }[]>(`
    SELECT COUNT(*) as count
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'Otp'
  `);

  if (Number(tableCheck[0].count) === 0) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`Otp\` (
        \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
        \`email\` VARCHAR(191) NOT NULL,
        \`code\` VARCHAR(191) NOT NULL,
        \`purpose\` VARCHAR(32) NOT NULL DEFAULT 'register',
        \`attempts\` INT NOT NULL DEFAULT 0,
        \`expiresAt\` DATETIME(3) NOT NULL,
        \`verified\` BOOLEAN NOT NULL DEFAULT false,
        INDEX \`Otp_email_idx\`(\`email\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    return;
  }

  const cols = await prisma.$queryRawUnsafe<{ COLUMN_NAME: string }[]>(`
    SELECT COLUMN_NAME FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'Otp'
  `);
  const names = new Set(cols.map((c) => c.COLUMN_NAME));
  if (!names.has("purpose")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`Otp\` ADD COLUMN \`purpose\` VARCHAR(32) NOT NULL DEFAULT 'register'`,
    );
  }
  if (!names.has("attempts")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`Otp\` ADD COLUMN \`attempts\` INT NOT NULL DEFAULT 0`,
    );
  }
};
