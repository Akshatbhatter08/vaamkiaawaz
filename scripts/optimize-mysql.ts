/**
 * Reclaim InnoDB space after replacing LONGTEXT blobs with short URLs.
 * Run on the server after migrate:blobs: npm run optimize:mysql
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Optimizing tables...");
  await prisma.$executeRawUnsafe("OPTIMIZE TABLE `BlogPost`, `User`, `Resource`");
  console.log("OPTIMIZE TABLE complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
