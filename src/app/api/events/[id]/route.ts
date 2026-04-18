import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) return authPayload;

  if (authPayload.role !== 'MASTER_ADMIN') {
    return NextResponse.json({ error: "केवल मास्टर एडमिन यह कर सकता है।" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID आवश्यक है।" }, { status: 400 });
  }

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM \`AbhiyanEvent\` WHERE id = ?`, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "इवेंट हटाने में विफल।" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) return authPayload;

  if (authPayload.role !== 'MASTER_ADMIN') {
    return NextResponse.json({ error: "केवल मास्टर एडमिन यह कर सकता है।" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID आवश्यक है।" }, { status: 400 });
  }

  const body = (await request.json()) as {
    title: string;
    date: string;
    time: string;
    location: string;
    details: string;
  };

  const { title, date, time, location, details } = body;
  
  if (!title || !details) {
    return NextResponse.json({ error: "शीर्षक और विवरण आवश्यक हैं।" }, { status: 400 });
  }

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE \`AbhiyanEvent\` SET title = ?, date = ?, time = ?, location = ?, details = ? WHERE id = ?`,
      title, date, time, location, details, id
    );
    return NextResponse.json({ success: true, event: { id, title, date, time, location, details } }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "इवेंट अपडेट करने में विफल।" }, { status: 500 });
  }
}
