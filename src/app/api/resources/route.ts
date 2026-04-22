import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ensureResourceTable = async () => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`Resource\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`type\` VARCHAR(191) NOT NULL,
        \`url\` VARCHAR(191) NULL,
        \`fileData\` LONGTEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.error("Resource table creation error:", err);
    throw err;
  }
};

export async function GET(request: NextRequest) {
  try {
    await ensureResourceTable();
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        url: true,
        createdAt: true,
      }
    });
    return NextResponse.json({ resources });
  } catch (error: any) {
    console.error("GET /api/resources error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch resources",
      details: error.message || String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await requireAuth(request);
    if (authPayload instanceof NextResponse) return authPayload;
    
    if (authPayload.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, type, url, fileData } = body;

    if (!title || !type) {
      return NextResponse.json({ error: "Title and type are required" }, { status: 400 });
    }

    if (type !== "pdf" && type !== "link") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const newResource = await prisma.resource.create({
      data: {
        title,
        type,
        url: url || null,
        fileData: fileData || null
      }
    });

    return NextResponse.json({ 
      resource: {
        id: newResource.id,
        title: newResource.title,
        type: newResource.type,
        url: newResource.url,
        createdAt: newResource.createdAt,
      } 
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/resources error:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
