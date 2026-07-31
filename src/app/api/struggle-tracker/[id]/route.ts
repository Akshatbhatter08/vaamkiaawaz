import { NextResponse, NextRequest } from "next/server";
import { requireUser, isMasterAdmin } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import {
  ensureStruggleTrackerTable,
  isStruggleStatus,
  parseSinceMonth,
  toStruggleTrackerEntry,
} from "@/lib/struggleTracker";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    if (user instanceof NextResponse) return user;

    if (!isMasterAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const dataToUpdate: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return NextResponse.json({ error: "नाम आवश्यक है" }, { status: 400 });
      dataToUpdate.name = name;
    }

    if (body.location !== undefined) {
      const location = typeof body.location === "string" ? body.location.trim() : "";
      if (!location) return NextResponse.json({ error: "स्थान आवश्यक है" }, { status: 400 });
      dataToUpdate.location = location;
    }

    if (body.description !== undefined) {
      const description = typeof body.description === "string" ? body.description.trim() : "";
      if (!description) return NextResponse.json({ error: "विवरण आवश्यक है" }, { status: 400 });
      dataToUpdate.description = description;
    }

    if (body.status !== undefined) {
      if (!isStruggleStatus(body.status)) {
        return NextResponse.json({ error: "अमान्य स्थिति" }, { status: 400 });
      }
      dataToUpdate.status = body.status;
    }

    if (body.sinceMonth !== undefined) {
      const sinceDate = parseSinceMonth(body.sinceMonth);
      if (!sinceDate) {
        return NextResponse.json({ error: "शुरुआत का महीना आवश्यक है" }, { status: 400 });
      }
      dataToUpdate.sinceDate = sinceDate;
    }

    if (body.isActive !== undefined) {
      dataToUpdate.isActive = body.isActive === true;
    }

    if (body.displayOrder !== undefined) {
      const displayOrder = Number(body.displayOrder);
      if (!Number.isInteger(displayOrder)) {
        return NextResponse.json({ error: "अमान्य क्रम" }, { status: 400 });
      }
      dataToUpdate.displayOrder = displayOrder;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "कोई बदलाव नहीं भेजा गया" }, { status: 400 });
    }

    await ensureStruggleTrackerTable();
    const updated = await prisma.struggleTracker.update({ where: { id }, data: dataToUpdate });

    return NextResponse.json({ entry: toStruggleTrackerEntry(updated) });
  } catch (error) {
    console.error("PUT /api/struggle-tracker/[id] error:", error);
    return NextResponse.json({ error: "संघर्ष अपडेट करने में त्रुटि" }, { status: 500 });
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
    await ensureStruggleTrackerTable();
    await prisma.struggleTracker.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/struggle-tracker/[id] error:", error);
    return NextResponse.json({ error: "संघर्ष हटाने में त्रुटि" }, { status: 500 });
  }
}
