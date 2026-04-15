import ClientPage, { NewsPost } from "./ClientPage";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatRelativeTime(isoDate: string) {
  const parsed = new Date(isoDate).getTime();
  if (Number.isNaN(parsed)) {
    return "अभी";
  }
  const diffMs = Date.now() - parsed;
  if (diffMs <= 20 * 1000) {
    return "अभी";
  }
  if (diffMs < 60 * 1000) {
    return "कुछ पल पहले";
  }
  if (diffMs < 60 * 60 * 1000) {
    return "कुछ मिनट पहले";
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    return "कुछ घंटे पहले";
  }
  return new Date(parsed).toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function Page() {
  let initialBlogs: NewsPost[] = [];
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: [{ createdAt: "desc" }],
    });

    initialBlogs = posts.map((post: any) => {
      const createdAtIso = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
      return {
        id: post.id,
        category: post.category,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        author: post.author,
        postImage: post.postImage ?? null,
        authorImage: post.authorImage ?? null,
        clickCount: post.clickCount ?? 0,
        uploaderName: post.uploaderName ?? null,
        createdAt: createdAtIso,
        time: formatRelativeTime(createdAtIso),
        source: "blog",
      };
    });
  } catch (error) {
    console.error("Error fetching initial blogs:", error);
  }

  return <ClientPage initialBlogs={initialBlogs} />;
}
