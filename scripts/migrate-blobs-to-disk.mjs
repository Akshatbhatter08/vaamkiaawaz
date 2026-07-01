/**
 * Plain Node migration (no tsx/esbuild). Run: node scripts/migrate-blobs-to-disk.mjs
 */
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const UPLOAD_SUBFOLDERS = ["posts", "content", "authors", "resources"];
const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

function getPublicMediaBase() {
  const base = process.env.UPLOAD_PUBLIC_BASE || "/api/media";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function isDataUri(value) {
  return value.startsWith("data:");
}

function mimeToExt(mimeType) {
  return MIME_TO_EXT[mimeType] || mimeType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "bin";
}

async function ensureUploadDirs() {
  const root = getUploadDir();
  await fs.mkdir(root, { recursive: true });
  for (const sub of UPLOAD_SUBFOLDERS) {
    await fs.mkdir(path.join(root, sub), { recursive: true });
  }
}

function dataUriToBuffer(dataUri) {
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  return { buffer, mimeType, ext: mimeToExt(mimeType) };
}

async function saveUpload(buffer, subfolder, ext) {
  await ensureUploadDirs();
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const filename = `${randomUUID()}.${safeExt}`;
  const relativePath = `${subfolder}/${filename}`;
  const fullPath = path.join(getUploadDir(), relativePath);
  await fs.writeFile(fullPath, buffer);
  return `${getPublicMediaBase()}/${relativePath}`;
}

const prisma = new PrismaClient();

async function replaceContentImages(html) {
  if (!html.includes("data:image")) return html;
  let content = html;
  const regex = /src=["'](data:image\/[^"']+)["']/gi;
  const seen = new Map();
  let match;
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
    const updates = {};
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
    let permissions = {};
    try {
      permissions =
        typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : user.permissions ?? {};
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
  console.log("UPLOAD_DIR:", getUploadDir());
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
