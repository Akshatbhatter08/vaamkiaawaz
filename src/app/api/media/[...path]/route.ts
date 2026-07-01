import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { resolveUploadPath } from "@/lib/fileStorage";

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

type Context = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { path: segments } = await context.params;
    const relativePath = segments.join("/");
    const fullPath = resolveUploadPath(relativePath);

    if (!fullPath) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat || !stat.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ext = path.extname(fullPath).replace(".", "").toLowerCase();
    const resolvedMime = EXT_TO_MIME[ext] || "application/octet-stream";
    const buffer = await fs.readFile(fullPath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": resolvedMime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("GET /api/media error:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
