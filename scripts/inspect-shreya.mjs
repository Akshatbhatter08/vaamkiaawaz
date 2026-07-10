import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({
    where: { email: "shreyajaiswalwbsu@gmail.com" },
    select: { email: true, role: true, permissions: true },
  });
  console.log("USER:", JSON.stringify(user, null, 2));

  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { authorUserId: user?.id },
        { uploaderName: "VKA-43UUB7" },
      ],
    },
    select: { id: true, title: true, author: true, uploaderName: true, authorUserId: true },
    take: 10,
  });
  console.log("POSTS:", JSON.stringify(posts, null, 2));
} finally {
  await prisma.$disconnect();
}
