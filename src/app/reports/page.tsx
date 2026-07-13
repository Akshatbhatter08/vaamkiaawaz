import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSession();

  if (!session?.id || typeof session.id !== "string") {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { role: true, active: true },
  });

  if (!user || !user.active || user.role !== "MASTER_ADMIN") {
    redirect("/");
  }

  const posts = await prisma.blogPost.findMany({
    where: { isHidden: false },
    select: {
      id: true,
      title: true,
      author: true,
      category: true,
      clickCount: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <ReportsClient posts={posts} />;
}
