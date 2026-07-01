import path from "path";

export const UPLOAD_SUBFOLDERS = ["posts", "content", "authors", "resources"] as const;
export type UploadSubfolder = (typeof UPLOAD_SUBFOLDERS)[number];

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
