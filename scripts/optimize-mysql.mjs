/**
 * Plain Node OPTIMIZE TABLE (no tsx). Run: node scripts/optimize-mysql.mjs
 */
import { PrismaClient } from "@prisma/client";
import { loadEnv } from "./load-env.mjs";

loadEnv();

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
