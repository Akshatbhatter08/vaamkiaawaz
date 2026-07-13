import { NextResponse, NextRequest } from "next/server";
import { requireUser, isMasterAdmin } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { isMediaUrl, isValidPdfRef } from "@/lib/fileStorage";

function publicResourceUrl(resource: { id: string; url: string | null; fileData: string | null }) {
  if (resource.url) return resource.url;
  if (resource.fileData) return `/api/resources/${resource.id}/file`;
  return null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resource = await prisma.resource.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        type: true,
        url: true,
        fileData: true,
        createdAt: true,
      },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({
      resource: {
        id: resource.id,
        title: resource.title,
        type: resource.type,
        url: publicResourceUrl(resource),
        createdAt: resource.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/resources/[id] error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    if (!isMasterAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.resource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/resources/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    if (!isMasterAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, type, url, fileData } = body;

    if (!title || !type) {
      return NextResponse.json({ error: "Title and type are required" }, { status: 400 });
    }

    if (type !== "pdf" && type !== "link") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const dataToUpdate: Record<string, unknown> = {
      title,
      type,
    };

    if (type === "link") {
      dataToUpdate.url = url || null;
      dataToUpdate.fileData = null;
    } else {
      const pdfRef = (url || fileData || "").trim();
      if (pdfRef) {
        if (!isValidPdfRef(pdfRef)) {
          return NextResponse.json({ error: "Invalid PDF format" }, { status: 400 });
        }
        if (isMediaUrl(pdfRef)) {
          dataToUpdate.url = pdfRef;
          dataToUpdate.fileData = null;
        } else {
          dataToUpdate.fileData = pdfRef;
          dataToUpdate.url = null;
        }
      }
    }

    const updatedResource = await prisma.resource.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({
      resource: {
        id: updatedResource.id,
        title: updatedResource.title,
        type: updatedResource.type,
        url: publicResourceUrl(updatedResource),
        createdAt: updatedResource.createdAt,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("PUT /api/resources error:", error);
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }
}
