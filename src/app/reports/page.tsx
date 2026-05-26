import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSession();

  // Redirect if not logged in or not MASTER_ADMIN
  if (!session || session.role !== "MASTER_ADMIN") {
    redirect("/");
  }

  // Fetch all posts with necessary statistics
  const posts = await prisma.blogPost.findMany({
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
