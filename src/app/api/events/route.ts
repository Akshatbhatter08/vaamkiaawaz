import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const ensureEventsSchema = async () => {
  const tableCheck = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*) as count
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'AbhiyanEvent'
  `);
  
  if (Number(tableCheck[0].count) === 0) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`AbhiyanEvent\` (
        \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
        \`title\` VARCHAR(191) NOT NULL,
        \`date\` VARCHAR(191) NOT NULL,
        \`time\` VARCHAR(191) NOT NULL,
        \`location\` VARCHAR(191) NOT NULL,
        \`details\` LONGTEXT NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }
};

export async function GET() {
  try {
    await ensureEventsSchema();
    const events = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM \`AbhiyanEvent\` ORDER BY \`createdAt\` DESC`
    );
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ events: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureEventsSchema();
  } catch (error) {
    return NextResponse.json({ error: "डेटाबेस त्रुटि।" }, { status: 500 });
  }

  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) return authPayload;
  
  if (authPayload.role !== 'MASTER_ADMIN') {
    return NextResponse.json({ error: "केवल मास्टर एडमिन यह कर सकता है।" }, { status: 403 });
  }

  const body = (await request.json()) as {
    title: string;
    date: string;
    time: string;
    location: string;
    details: string;
  };

  const { title, date, time, location, details } = body;
  
  if (!title || !date || !time || !location || !details) {
    return NextResponse.json({ error: "सभी फील्ड्स आवश्यक हैं।" }, { status: 400 });
  }

  const id = crypto.randomUUID();

  await prisma.$executeRawUnsafe(
    `INSERT INTO \`AbhiyanEvent\` (\`id\`, \`title\`, \`date\`, \`time\`, \`location\`, \`details\`) VALUES (?, ?, ?, ?, ?, ?)`,
    id, title, date, time, location, details
  );

  return NextResponse.json({ success: true, event: { id, title, date, time, location, details } }, { status: 201 });
}
