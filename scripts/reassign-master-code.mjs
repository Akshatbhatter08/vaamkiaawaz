import { PrismaClient } from "@prisma/client";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateContributorCode() {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `VKA-${suffix}`;
}

function parsePermissions(input) {
  if (typeof input !== "string" || !input.trim()) return {};
  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

const prisma = new PrismaClient();

try {
  const masterAdmins = await prisma.user.findMany({
    where: { role: "MASTER_ADMIN" },
    select: { id: true, email: true, permissions: true },
  });

  for (const user of masterAdmins) {
    const permissions = parsePermissions(user.permissions);
    const currentCode =
      typeof permissions.contributorCode === "string" ? permissions.contributorCode.trim() : "";

    const nextCode =
      !currentCode || currentCode === "VKA-MASTER" ? generateContributorCode() : currentCode;

    if (nextCode !== currentCode) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          permissions: JSON.stringify({
            ...permissions,
            contributorCode: nextCode,
          }),
        },
      });
    }

    const legacyUploaders = ["VKA-MASTER", "मास्टर एडमिन", "केशव कुमार भट्टड़", "केशव कुमार भट्टड़ "];
    const postUpdate = await prisma.blogPost.updateMany({
      where: {
        OR: [
          { authorUserId: user.id },
          { uploaderName: { in: legacyUploaders } },
        ],
      },
      data: { uploaderName: nextCode },
    });

    console.log(`${user.email} -> ${nextCode} (updated ${postUpdate.count} post(s))`);
  }
} finally {
  await prisma.$disconnect();
}
