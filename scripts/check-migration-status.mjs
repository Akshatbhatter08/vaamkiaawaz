import { PrismaClient } from "@prisma/client";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.blogPost.findMany({
    select: { postImage: true, content: true },
  });
  let base64Images = 0;
  let mediaUrls = 0;
  let otherImages = 0;
  let contentBase64 = 0;
  for (const post of posts) {
    if (post.postImage?.startsWith("data:")) base64Images += 1;
    else if (post.postImage?.startsWith("/api/media")) mediaUrls += 1;
    else if (post.postImage) otherImages += 1;
    if (post.content?.includes("data:image")) contentBase64 += 1;
  }

  const users = await prisma.user.findMany({ select: { permissions: true } });
  let base64Avatars = 0;
  let mediaAvatars = 0;
  for (const user of users) {
    let permissions = {};
    try {
      permissions =
        typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : user.permissions ?? {};
    } catch {
      continue;
    }
    const img = typeof permissions.authorImage === "string" ? permissions.authorImage : "";
    if (img.startsWith("data:")) base64Avatars += 1;
    else if (img.startsWith("/api/media")) mediaAvatars += 1;
  }

  const resources = await prisma.resource.findMany({
    select: { type: true, fileData: true, url: true },
  });
  let base64Pdfs = 0;
  let mediaPdfs = 0;
  for (const r of resources) {
    if (r.type !== "pdf") continue;
    if (r.fileData?.startsWith("data:")) base64Pdfs += 1;
    else if (r.url?.startsWith("/api/media")) mediaPdfs += 1;
  }

  console.log(JSON.stringify({
    totalPosts: posts.length,
    postImageBase64: base64Images,
    postImageMediaUrl: mediaUrls,
    postImageOther: otherImages,
    contentWithBase64Images: contentBase64,
    base64Avatars,
    mediaAvatars,
    base64Pdfs,
    mediaPdfs,
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
