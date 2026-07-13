import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMediaUrl } from "@/lib/fileStorage";

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
