import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resource = await prisma.resource.findUnique({
      where: { id },
    });
    
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    
    return NextResponse.json({ resource });
  } catch (error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authPayload = await requireAuth(request);
    if (authPayload instanceof NextResponse) return authPayload;
    
    if (authPayload.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.resource.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authPayload = await requireAuth(request);
    if (authPayload instanceof NextResponse) return authPayload;
    
    if (authPayload.role !== "MASTER_ADMIN") {
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

    const dataToUpdate: any = {
      title,
      type,
      url: type === "link" ? url : null,
    };
    if (fileData) {
      dataToUpdate.fileData = fileData;
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
        url: updatedResource.url,
        createdAt: updatedResource.createdAt,
      } 
    }, { status: 200 });

  } catch (error) {
    console.error("PUT /api/resources error:", error);
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }
}
