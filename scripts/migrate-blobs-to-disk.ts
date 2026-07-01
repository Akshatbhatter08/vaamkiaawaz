/**
 * One-time migration: move base64 blobs from MySQL to disk.
 * Run on the server: npm run migrate:blobs
 */
import { PrismaClient } from "@prisma/client";
import {
  dataUriToBuffer,
  isDataUri,
  saveUpload,
} from "../src/lib/fileStorage";

const prisma = new PrismaClient();

async function replaceContentImages(html: string): Promise<string> {
  if (!html.includes("data:image")) return html;
  let content = html;
  const regex = /src=["'](data:image\/[^"']+)["']/gi;
  const seen = new Map<string, string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const dataUri = match[1];
    if (seen.has(dataUri)) continue;
    const parsed = dataUriToBuffer(dataUri);
    if (!parsed) continue;
    const url = await saveUpload(parsed.buffer, "content", parsed.ext);
    seen.set(dataUri, url);
  }
  for (const [from, to] of seen) {
    content = content.split(from).join(to);
  }
  return content;
}

async function migratePosts() {
  const posts = await prisma.blogPost.findMany({
    select: { id: true, postImage: true, authorImage: true, content: true },
  });
  let count = 0;
  for (const post of posts) {
    const updates: Record<string, string | null> = {};
    if (post.postImage && isDataUri(post.postImage)) {
      const parsed = dataUriToBuffer(post.postImage);
      if (parsed) {
        updates.postImage = await saveUpload(parsed.buffer, "posts", parsed.ext);
      }
    }
    if (post.authorImage && isDataUri(post.authorImage)) {
      updates.authorImage = null;
    }
    if (post.content?.includes("data:image")) {
      updates.content = await replaceContentImages(post.content);
    }
    if (Object.keys(updates).length > 0) {
      await prisma.blogPost.update({ where: { id: post.id }, data: updates });
      count += 1;
    }
  }
  console.log(`Migrated ${count} blog posts.`);
}

async function migrateUsers() {
  const users = await prisma.user.findMany({ select: { id: true, permissions: true } });
  let count = 0;
  for (const user of users) {
    let permissions: Record<string, unknown> = {};
    try {
      permissions =
        typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : ((user.permissions ?? {}) as Record<string, unknown>);
    } catch {
      continue;
    }
    const rawImage = typeof permissions.authorImage === "string" ? permissions.authorImage.trim() : "";
    if (!rawImage || !isDataUri(rawImage)) continue;
    const parsed = dataUriToBuffer(rawImage);
    if (!parsed) continue;
    const url = await saveUpload(parsed.buffer, "authors", parsed.ext);
    permissions.authorImage = url;
    await prisma.user.update({
      where: { id: user.id },
      data: { permissions: JSON.stringify(permissions) },
    });
    count += 1;
  }
  console.log(`Migrated ${count} user avatars.`);
}

async function migrateResources() {
  const resources = await prisma.resource.findMany({
    select: { id: true, type: true, url: true, fileData: true },
  });
  let count = 0;
  for (const resource of resources) {
    if (resource.type !== "pdf" || !resource.fileData || !isDataUri(resource.fileData)) continue;
    const parsed = dataUriToBuffer(resource.fileData);
    if (!parsed) continue;
    const url = await saveUpload(parsed.buffer, "resources", parsed.ext);
    await prisma.resource.update({
      where: { id: resource.id },
      data: { url, fileData: null },
    });
    count += 1;
  }
  console.log(`Migrated ${count} PDF resources.`);
}

async function main() {
  console.log("Starting blob migration...");
  await migratePosts();
  await migrateUsers();
  await migrateResources();
  console.log("Migration complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
