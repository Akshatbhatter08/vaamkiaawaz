import { NextResponse, NextRequest } from "next/server";
import { requireUser, isMasterAdmin } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { isMediaUrl, isValidPdfRef } from "@/lib/fileStorage";

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

export async function GET() {
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
        fileData: true,
      },
    });
    const mapped = resources.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      url: r.url || (r.fileData ? `/api/resources/${r.id}/file` : null),
      createdAt: r.createdAt,
    }));
    return NextResponse.json({ resources: mapped });
  } catch (error) {
    console.error("GET /api/resources error:", error);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    if (!isMasterAdmin(user)) {
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

    if (type === "pdf") {
      const pdfRef = (url || fileData || "").trim();
      if (!pdfRef) {
        return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
      }
      if (!isValidPdfRef(pdfRef)) {
        return NextResponse.json({ error: "Invalid PDF format" }, { status: 400 });
      }
      const storedUrl = isMediaUrl(pdfRef) ? pdfRef : null;
      const storedFileData = !isMediaUrl(pdfRef) ? pdfRef : null;
      const newResource = await prisma.resource.create({
        data: {
          title,
          type,
          url: storedUrl,
          fileData: storedFileData,
        },
      });
      return NextResponse.json(
        {
          resource: {
            id: newResource.id,
            title: newResource.title,
            type: newResource.type,
            url: newResource.url || `/api/resources/${newResource.id}/file`,
            createdAt: newResource.createdAt,
          },
        },
        { status: 201 },
      );
    }

    const newResource = await prisma.resource.create({
      data: {
        title,
        type,
        url: url || null,
        fileData: null,
      },
    });

    return NextResponse.json(
      {
        resource: {
          id: newResource.id,
          title: newResource.title,
          type: newResource.type,
          url: newResource.url,
          createdAt: newResource.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/resources error:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
