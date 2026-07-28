import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [categories, postCategoryRows] = await Promise.all([
      prisma.category.findMany(),
      prisma.blogPost.findMany({
        where: { isHidden: false },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
    ]);

    const postCategories = postCategoryRows
      .map((row) => row.category.trim())
      .filter((name) => name.length > 0);

    return NextResponse.json({ categories, postCategories }, { status: 200 });
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
