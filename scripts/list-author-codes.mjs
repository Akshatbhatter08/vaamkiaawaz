import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatPenNameLabel(permissions) {
  const penNameEnabled = permissions.penNameEnabled === true;
  const penName = typeof permissions.penName === "string" ? permissions.penName.trim() : "";
  const penNameDisplayMode = permissions.penNameDisplayMode === "only" ? "only" : "alongside";
  if (!penNameEnabled || !penName) {
    return "—";
  }
  if (penNameDisplayMode === "only") {
    return penName;
  }
  const base = typeof permissions.authorName === "string" ? permissions.authorName.trim() : "";
  if (!base) {
    return penName;
  }
  return `${base} '${penName}'`;
}

try {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, active: true, permissions: true },
    orderBy: { createdAt: "asc" },
  });

  for (const user of users) {
    let permissions = {};
    try {
      permissions = JSON.parse(user.permissions || "{}");
    } catch {
      permissions = {};
    }

    const name = typeof permissions.authorName === "string" && permissions.authorName.trim()
      ? permissions.authorName.trim()
      : user.role === "MASTER_ADMIN"
        ? "केशव कुमार भट्टड़"
        : "(no name)";

    const code =
      typeof permissions.contributorCode === "string" && permissions.contributorCode.trim()
        ? permissions.contributorCode.trim()
        : "(none)";

    const penName = formatPenNameLabel(permissions);

    console.log(`${name} | ${penName} | ${user.email} | ${user.role} | ${user.active ? "active" : "inactive"} | ${code}`);
  }
} finally {
  await prisma.$disconnect();
}
