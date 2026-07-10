import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({
    where: { email: "shreyajaiswalwbsu@gmail.com" },
    select: { id: true, permissions: true },
  });
  if (!user) {
    throw new Error("User not found");
  }

  let permissions = {};
  try {
    permissions = JSON.parse(user.permissions || "{}");
  } catch {
    permissions = {};
  }

  const restored = {
    ...permissions,
    authorName: "श्रेया जायसवाल",
    penNameEnabled: true,
    penName: typeof permissions.penName === "string" ? permissions.penName : "अपराजिता",
    penNameDisplayMode: "only",
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { permissions: JSON.stringify(restored) },
  });

  console.log("Restored permissions:", JSON.stringify(restored, null, 2));
} finally {
  await prisma.$disconnect();
}
