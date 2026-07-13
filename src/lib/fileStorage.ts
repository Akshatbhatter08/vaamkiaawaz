import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export const UPLOAD_SUBFOLDERS = ["posts", "content", "authors", "resources"] as const;
export type UploadSubfolder = (typeof UPLOAD_SUBFOLDERS)[number];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

export function getPublicMediaBase(): string {
  const base = process.env.UPLOAD_PUBLIC_BASE || "/api/media";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export function isDataUri(value: string): boolean {
  return value.startsWith("data:");
}

export function isMediaUrl(value: string): boolean {
  if (!value) return false;
  const base = getPublicMediaBase();
  return value.startsWith(`${base}/`) || value.startsWith("/api/media/");
}

export function isValidImageRef(value: string | null | undefined): boolean {
  if (!value) return false;
  return (isDataUri(value) && value.startsWith("data:image/")) || isMediaUrl(value);
}

export function isValidAuthorImageRef(value: string | null | undefined): boolean {
  if (!value) return true;
  return isValidImageRef(value);
}

export function isValidPdfRef(value: string | null | undefined): boolean {
  if (!value) return false;
  return (isDataUri(value) && value.startsWith("data:application/pdf")) || isMediaUrl(value);
}

export async function ensureUploadDirs(): Promise<void> {
  const root = getUploadDir();
  await fs.mkdir(root, { recursive: true });
  for (const sub of UPLOAD_SUBFOLDERS) {
    await fs.mkdir(path.join(root, sub), { recursive: true });
  }
}

export function resolveUploadPath(relativePath: string): string | null {
  const cleaned = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleaned || cleaned.includes("..")) return null;

  const segments = cleaned.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  if (!UPLOAD_SUBFOLDERS.includes(segments[0] as UploadSubfolder)) return null;

  const root = path.resolve(getUploadDir());
  const full = path.resolve(path.join(root, ...segments));
  if (!full.startsWith(root + path.sep)) return null;
  return full;
}

export function mimeToExt(mimeType: string): string {
  return MIME_TO_EXT[mimeType] || mimeType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "bin";
}

export async function saveUpload(buffer: Buffer, subfolder: UploadSubfolder, ext: string): Promise<string> {
  await ensureUploadDirs();
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const filename = `${randomUUID()}.${safeExt}`;
  const relativePath = `${subfolder}/${filename}`;
  const fullPath = path.join(getUploadDir(), relativePath);
  await fs.writeFile(fullPath, buffer);
  return `${getPublicMediaBase()}/${relativePath}`;
}

export function dataUriToBuffer(dataUri: string): { buffer: Buffer; mimeType: string; ext: string } | null {
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  return { buffer, mimeType, ext: mimeToExt(mimeType) };
}

export function mediaUrlToRelativePath(url: string): string | null {
  const base = getPublicMediaBase();
  if (url.startsWith(`${base}/`)) {
    return url.slice(base.length + 1);
  }
  if (url.startsWith("/api/media/")) {
    return url.slice("/api/media/".length);
  }
  return null;
}

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PDF_MAX_BYTES = 3.5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
export const ALLOWED_PDF_MIMES = new Set(["application/pdf"]);

/** Media URL only (no data: URI) for new post/cover images. */
export function isValidMediaImageUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return isMediaUrl(value);
}

type DetectedType = { mime: string; ext: string } | null;

/** Verify real file type from magic bytes; reject spoofed MIME. */
export function detectFileType(buffer: Buffer): DetectedType {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { mime: "image/gif", ext: "gif" };
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  if (buffer.toString("ascii", 0, 4) === "%PDF") {
    return { mime: "application/pdf", ext: "pdf" };
  }
  return null;
}