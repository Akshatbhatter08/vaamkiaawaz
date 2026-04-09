import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const MASTER_ADMIN_AUTHOR_NAME = "केशव कुमार भट्टर";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const masterAdminCount = await prisma.user.count({
      where: { role: "MASTER_ADMIN" }
    });

    if (masterAdminCount > 0) {
      return NextResponse.json({ error: "Master Admin already exists." }, { status: 403 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "MASTER_ADMIN",
        permissions: {
          authorName: MASTER_ADMIN_AUTHOR_NAME,
        },
      }
    });

    return NextResponse.json({ message: "Master Admin created successfully!", user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "An error occurred during setup." }, { status: 500 });
  }
}
