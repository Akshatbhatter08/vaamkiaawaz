import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, isHidden } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid category name" }, { status: 400 });
    }

    const category = await prisma.category.upsert({
      where: { name: name.trim() },
      update: { isHidden: Boolean(isHidden) },
      create: { name: name.trim(), isHidden: Boolean(isHidden) },
    });

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create/update category" }, { status: 500 });
  }
}
