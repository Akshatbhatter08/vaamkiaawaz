import ClientPage, { NewsPost } from "./ClientPage";
import { prisma } from "@/lib/prisma";
import { ensureBlogSchema } from "@/lib/db-setup";
import { enrichPostsWithAuthorImages } from "@/lib/authorImages";
import { enrichPostsWithThumbnails } from "@/lib/postImageEnrich";

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
  let initialTopBlogs: NewsPost[] = [];
  try {
    await ensureBlogSchema();
    const posts = await prisma.blogPost.findMany({
      where: { isHidden: false },
      select: {
        id: true,
        category: true,
        title: true,
        excerpt: true,
        author: true,
        postImage: true,
        imageFocus: true,
        authorImage: true,
        clickCount: true,
        uploaderName: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 30, // Limit homepage to latest 30 posts to ensure extremely fast loading
    });

    const topPosts = await prisma.blogPost.findMany({
      where: { isHidden: false },
      select: {
        id: true,
        category: true,
        title: true,
        excerpt: true,
        author: true,
        postImage: true,
        imageFocus: true,
        authorImage: true,
        clickCount: true,
        uploaderName: true,
        createdAt: true,
      },
      orderBy: [{ clickCount: "desc" }],
      take: 10,
    });

    const enrichedPosts = await enrichPostsWithThumbnails(await enrichPostsWithAuthorImages(posts));
    const enrichedTopPosts = await enrichPostsWithThumbnails(await enrichPostsWithAuthorImages(topPosts));

    const mapToNewsPost = (post: (typeof enrichedPosts)[number]) => {
      const createdAtIso = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
      return {
        id: post.id,
        category: post.category,
        title: post.title,
        excerpt: post.excerpt,
        content: "", // Intentionally omit content from the client payload to prevent 20MB hydration issues
        author: post.author,
        postImage: post.postImage ?? null,
        imageFocus: post.imageFocus ?? null,
        authorImage: post.authorImage ?? null,
        clickCount: post.clickCount ?? 0,
        uploaderName: post.uploaderName ?? null,
        createdAt: createdAtIso,
        time: formatRelativeTime(createdAtIso),
        source: "blog" as const,
      };
    };

    initialBlogs = enrichedPosts.map(mapToNewsPost);
    initialTopBlogs = enrichedTopPosts.map(mapToNewsPost);
  } catch (error) {
    console.error("Error fetching initial blogs:", error);
  }

  let initialEvents = [];
  try {
    const events = await prisma.abhiyanEvent.findMany({
      orderBy: [{ date: "desc" }, { time: "desc" }],
    });
    initialEvents = events.map((e: any) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching initial events:", error);
  }

  let initialResources = [];
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
    });
    initialResources = resources.map((r: any) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
    }));
  } catch (error) {
    console.error("Error fetching initial resources:", error);
  }

  return (
    <ClientPage
      initialBlogs={initialBlogs}
      initialTopBlogs={initialTopBlogs}
      initialEvents={initialEvents}
      initialResources={initialResources}
    />
  );
}
