import { PrismaClient } from "@prisma/client";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MASTER_ADMIN_AUTHOR_NAME = "केशव कुमार भट्टड़";

function parsePermissions(input) {
  if (typeof input !== "string" || !input.trim()) return {};
  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parsePenName(permissions) {
  return {
    penNameEnabled: permissions.penNameEnabled === true,
    penName: typeof permissions.penName === "string" ? permissions.penName.trim() : "",
    penNameDisplayMode: permissions.penNameDisplayMode === "only" ? "only" : "alongside",
  };
}

function formatPenNameLabel(permissions) {
  const pen = parsePenName(permissions);
  if (!pen.penNameEnabled || !pen.penName) {
    return "—";
  }
  if (pen.penNameDisplayMode === "only") {
    return pen.penName;
  }
  const base =
    typeof permissions.authorName === "string" && permissions.authorName.trim()
      ? permissions.authorName.trim()
      : "";
  if (!base) {
    return pen.penName;
  }
  return `${base} '${pen.penName}'`;
}

function authorBaseName(permissions, role) {
  const authorName = typeof permissions.authorName === "string" ? permissions.authorName.trim() : "";
  if (authorName) return authorName;
  if (role === "MASTER_ADMIN") return MASTER_ADMIN_AUTHOR_NAME.trim();
  return "";
}

function authorAliases(permissions, role) {
  const base = authorBaseName(permissions, role);
  const pen = parsePenName(permissions);
  const aliases = new Set();
  if (base) aliases.add(base);
  if (pen.penName) aliases.add(pen.penName);
  if (base && pen.penName && pen.penNameEnabled) {
    aliases.add(`${base} '${pen.penName}'`);
    aliases.add(`${base} ‘${pen.penName}’`);
  }
  return [...aliases];
}

function generateContributorCode(usedCodes) {
  for (let attempt = 0; attempt < 50; attempt++) {
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    const code = `VKA-${suffix}`;
    if (!usedCodes.has(code)) {
      usedCodes.add(code);
      return code;
    }
  }
  throw new Error("Unable to generate a unique contributor code.");
}

function canPublish(user, permissions) {
  if (user.role === "MASTER_ADMIN") return true;
  if (user.role === "CONTRIBUTOR" && user.active) return true;
  if (user.role === "ADMIN" && permissions.publishBlog === true) return true;
  return false;
}

function roleLabel(role) {
  if (role === "MASTER_ADMIN") return "Master Admin";
  if (role === "ADMIN") return "Admin";
  return "Contributor";
}

const prisma = new PrismaClient();

try {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, active: true, permissions: true },
    orderBy: { createdAt: "asc" },
  });

  const usedCodes = new Set();
  for (const user of users) {
    const permissions = parsePermissions(user.permissions);
    const code =
      typeof permissions.contributorCode === "string" ? permissions.contributorCode.trim() : "";
    if (code && code !== "VKA-MASTER") {
      usedCodes.add(code);
    }
  }

  const publishers = [];
  let assignedCount = 0;
  let postsUpdated = 0;

  for (const user of users) {
    const permissions = parsePermissions(user.permissions);
    if (!canPublish(user, permissions)) {
      continue;
    }

    let code =
      typeof permissions.contributorCode === "string" ? permissions.contributorCode.trim() : "";
    if (!code || code === "VKA-MASTER") {
      code = generateContributorCode(usedCodes);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          permissions: JSON.stringify({
            ...permissions,
            contributorCode: code,
          }),
        },
      });
      assignedCount += 1;
      permissions.contributorCode = code;
    }

    const aliases = authorAliases(permissions, user.role);

    const byUserId = await prisma.blogPost.updateMany({
      where: { authorUserId: user.id },
      data: { uploaderName: code },
    });

    let byAuthor = { count: 0 };
    if (aliases.length > 0) {
      byAuthor = await prisma.blogPost.updateMany({
        where: {
          author: { in: aliases },
          NOT: { uploaderName: code },
        },
        data: { uploaderName: code, authorUserId: user.id },
      });
    }

    postsUpdated += byUserId.count + byAuthor.count;

    publishers.push({
      role: roleLabel(user.role),
      email: user.email,
      active: user.active,
      authorName: authorBaseName(permissions, user.role) || "(no name)",
      penName: formatPenNameLabel(permissions),
      code,
    });
  }

  console.log(`Assigned new codes: ${assignedCount}`);
  console.log(`Post uploader rows normalized: ${postsUpdated}`);
  console.log("");
  console.log("ROLE | AUTHOR NAME | PEN NAME | EMAIL | STATUS | CODE");
  console.log("-----|-------------|----------|-------|--------|------");
  for (const row of publishers) {
    console.log(
      `${row.role} | ${row.authorName} | ${row.penName} | ${row.email} | ${row.active ? "active" : "inactive"} | ${row.code}`,
    );
  }
} finally {
  await prisma.$disconnect();
}
