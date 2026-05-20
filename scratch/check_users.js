const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, active: true, permissions: true }
  });
  for (const u of users) {
    const perm = u.permissions ? JSON.parse(typeof u.permissions === 'string' ? u.permissions : JSON.stringify(u.permissions)) : {};
    console.log(`email=${u.email} | role=${u.role} | active=${u.active} | authorName=${perm.authorName || 'NONE'} | hasImage=${!!perm.authorImage}`);
  }
  await prisma.$disconnect();
}
main();
