import { NextResponse, NextRequest } from "next/server";
import { requireUser, isMasterAdmin } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import {
  ensureStruggleTrackerTable,
  isStruggleStatus,
  parseSinceMonth,
  readStruggleTrackerEntries,
  toStruggleTrackerEntry,
} from "@/lib/struggleTracker";

export async function GET(request: NextRequest) {
  try {
    const wantsInactive = request.nextUrl.searchParams.get("includeInactive") === "1";

    if (wantsInactive) {
      const user = await requireUser(request);
      if (user instanceof NextResponse) return user;
      if (!isMasterAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const entries = await readStruggleTrackerEntries({ includeInactive: wantsInactive });
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("GET /api/struggle-tracker error:", error);
    return NextResponse.json({ entries: [] });
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const sinceDate = parseSinceMonth(body.sinceMonth);

    if (!name || !location || !description) {
      return NextResponse.json({ error: "नाम, स्थान और विवरण आवश्यक हैं" }, { status: 400 });
    }
    if (!isStruggleStatus(body.status)) {
      return NextResponse.json({ error: "अमान्य स्थिति" }, { status: 400 });
    }
    if (!sinceDate) {
      return NextResponse.json({ error: "शुरुआत का महीना आवश्यक है" }, { status: 400 });
    }

    await ensureStruggleTrackerTable();

    const last = await prisma.struggleTracker.findFirst({ orderBy: { displayOrder: "desc" } });
    const created = await prisma.struggleTracker.create({
      data: {
        name,
        status: body.status,
        location,
        description,
        sinceDate,
        displayOrder: (last?.displayOrder ?? -1) + 1,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ entry: toStruggleTrackerEntry(created) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/struggle-tracker error:", error);
    return NextResponse.json({ error: "संघर्ष जोड़ने में त्रुटि" }, { status: 500 });
  }
}
