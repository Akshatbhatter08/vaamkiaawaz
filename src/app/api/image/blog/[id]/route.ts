import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { isMediaUrl, mediaUrlToRelativePath, resolveUploadPath } from "@/lib/fileStorage";

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function safeDefaultRedirect(req: Request) {
  return NextResponse.redirect(new URL("/vaamki-logo-sm.png", req.url));
}

function isSafeLocalPath(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("//")) return false;
  if (isMediaUrl(value)) return true;
  if (value.startsWith("/api/media/")) return true;
  if (value.startsWith("/") && !value.startsWith("//")) {
    // Relative same-origin path only (no scheme, no host)
    try {
      const resolved = new URL(value, "https://vaamkiaawaz.local");
      return resolved.origin === "https://vaamkiaawaz.local";
    } catch {
      return false;
    }
  }
  return false;
}

async function serveMediaFile(dataUri: string, req: Request) {
  const relative = mediaUrlToRelativePath(dataUri);
  const fullPath = relative ? resolveUploadPath(relative) : null;
  if (!fullPath) {
    return safeDefaultRedirect(req);
  }

  const stat = await fs.stat(fullPath).catch(() => null);
  if (!stat || !stat.isFile()) {
    return safeDefaultRedirect(req);
  }

  const ext = path.extname(fullPath).replace(".", "").toLowerCase();
  const mimeType = EXT_TO_MIME[ext] || "application/octet-stream";
  const buffer = await fs.readFile(fullPath);

  return new Response(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(buffer.length),
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { postImage: true, content: true },
    });

    let dataUri = post?.postImage;

    if (!dataUri && post?.content) {
      const match = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      dataUri = match ? match[1] : null;
    }

    if (!dataUri) {
      return safeDefaultRedirect(req);
    }

    if (dataUri.startsWith("data:image/")) {
      const matches = dataUri.match(/^data:(image\/[a-z0-9+.-]+);base64,(.+)$/i);
      if (!matches || matches.length !== 3) {
        return safeDefaultRedirect(req);
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      return new Response(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Disk-backed media: stream bytes (do not redirect — WhatsApp often skips redirects)
    if (isMediaUrl(dataUri) || dataUri.startsWith("/api/media/")) {
      return serveMediaFile(dataUri, req);
    }

    // Never redirect to arbitrary external / protocol-relative hosts (open redirect)
    if (!isSafeLocalPath(dataUri)) {
      return safeDefaultRedirect(req);
    }

    const url = new URL(dataUri, req.url);
    if (url.origin !== new URL(req.url).origin) {
      return safeDefaultRedirect(req);
    }
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error serving image:", error);
    return safeDefaultRedirect(req);
  }
}
