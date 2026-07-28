import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

/** Serve legacy base64 PDF fileData without embedding it in JSON responses. */
export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { title: true, type: true, url: true, fileData: true },
    });

    if (!resource || resource.type !== "pdf") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (resource.url) {
      return NextResponse.redirect(new URL(resource.url, _request.url));
    }

    const fileData = resource.fileData || "";
    if (!fileData.startsWith("data:application/pdf")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buffer = Buffer.from(matches[2], "base64");
    const safeName = (resource.title || "resource").replace(/[^\w\u0900-\u097F.-]+/g, "_");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("GET /api/resources/[id]/file error:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
