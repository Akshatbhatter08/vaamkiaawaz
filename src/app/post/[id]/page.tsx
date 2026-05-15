import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ArticlePage from "./ArticlePage";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Extract the first image URL from HTML content.
 */
function extractFirstImageFromContent(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Determine the best Open Graph image for a post.
 * Priority: postImage > first image in content > website logo
 */
function getOgImage(post: { postImage: string | null; content: string }): string {
  // 1. Post thumbnail (skip data URIs — WhatsApp can't use them)
  if (post.postImage && !post.postImage.startsWith("data:")) {
    return post.postImage;
  }

  // 2. First image inside the article content (skip data URIs)
  const contentImage = extractFirstImageFromContent(post.content);
  if (contentImage && !contentImage.startsWith("data:")) {
    return contentImage;
  }

  // 3. Fallback to website logo
  return "/vaamki-logo-sm.png";
}

function formatRelativeTime(isoDate: string) {
  const parsed = new Date(isoDate).getTime();
  if (Number.isNaN(parsed)) return "अभी";
  const diffMs = Date.now() - parsed;
  if (diffMs <= 20 * 1000) return "अभी";
  if (diffMs < 60 * 1000) return "कुछ पल पहले";
  if (diffMs < 60 * 60 * 1000) return "कुछ मिनट पहले";
  if (diffMs < 24 * 60 * 60 * 1000) return "कुछ घंटे पहले";
  return new Date(parsed).toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function mapPostForClient(post: any) {
  const createdAtIso = post.createdAt
    ? new Date(post.createdAt).toISOString()
    : new Date().toISOString();
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
    authorUserId: post.authorUserId ?? null,
    createdAt: createdAtIso,
    time: formatRelativeTime(createdAtIso),
    source: "blog" as const,
  };
}

/**
 * Generate rich Open Graph + Twitter Card metadata so WhatsApp, Facebook,
 * and other platforms display a proper preview card when the link is shared.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: {
      title: true,
      excerpt: true,
      content: true,
      postImage: true,
    },
  });

  // Fallback metadata if the post doesn't exist
  if (!post) {
    return {
      title: "वाम की आवाज़ | जन समाचार मंच",
      description:
        "जन-संघर्ष, सामाजिक न्याय, अल्पसंख्यक और लोकतांत्रिक मुद्दों पर खबर और विचार केंद्रित न्यूज पोर्टल",
    };
  }

  const ogImage = getOgImage(post);
  const plainExcerpt = (post.excerpt || "").replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();

  return {
    title: `${post.title} | वाम की आवाज़ | जन समाचार मंच`,
    description: `${plainExcerpt} — जन-संघर्ष, सामाजिक न्याय, अल्पसंख्यक और लोकतांत्रिक मुद्दों पर खबर और विचार केंद्रित न्यूज पोर्टल`,
    openGraph: {
      title: `${post.title} | वाम की आवाज़ | जन समाचार मंच`,
      description: `${plainExcerpt} — जन-संघर्ष, सामाजिक न्याय, अल्पसंख्यक और लोकतांत्रिक मुद्दों पर खबर और विचार केंद्रित न्यूज पोर्टल`,
      siteName: "वाम की आवाज़ — विकल्प की डिजिटल दुनिया",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | वाम की आवाज़ | जन समाचार मंच`,
      description: `${post.excerpt} — जन-संघर्ष, सामाजिक न्याय, अल्पसंख्यक और लोकतांत्रिक मुद्दों पर खबर और विचार केंद्रित न्यूज पोर्टल`,
      images: [ogImage],
    },
  };
}

/**
 * This page renders a full article reading experience.
 * It fetches the post server-side (for SSR + SEO), along with
 * related posts for "suggested reading" and sidebar data.
 */
export default async function PostPage({ params }: Props) {
  const { id } = await params;

  // Fetch the main post
  const post = await prisma.blogPost.findUnique({ where: { id } });

  if (!post) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">लेख नहीं मिला</h1>
          <p className="text-gray-500 mb-4">यह लेख हटा दिया गया है या उपलब्ध नहीं है।</p>
          <a href="/" className="text-[#9f171b] font-semibold hover:underline">
            ← होमपेज पर वापस जाएं
          </a>
        </div>
      </div>
    );
  }

  // Start non-critical updates asynchronously
  prisma.blogPost.update({
    where: { id },
    data: { clickCount: { increment: 1 } },
  }).catch(() => {});

  const mappedPost = mapPostForClient(post);

  // Fire all independent database queries concurrently
  const sameCategoryPostsPromise = prisma.blogPost.findMany({
    where: { category: post.category, id: { not: post.id } },
    orderBy: [{ clickCount: "desc" }, { createdAt: "desc" }],
    take: 3,
  });

  const topReadPostsPromise = prisma.blogPost.findMany({
    orderBy: { clickCount: "desc" },
    take: 5,
  });

  const eventsPromise = (prisma as any).abhiyanEvent.findMany({
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const resourcesPromise = prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, type: true, url: true, createdAt: true },
  }).catch(() => []);

  // Wait for all concurrent queries
  const [sameCategoryPosts, topReadPosts, events, resources] = await Promise.all([
    sameCategoryPostsPromise,
    topReadPostsPromise,
    eventsPromise,
    resourcesPromise
  ]);

  // If we don't have enough same-category posts, fill with recent popular posts
  const remainingSlots = 4 - sameCategoryPosts.length;
  let fillPosts: any[] = [];
  if (remainingSlots > 0) {
    const excludeIds = [post.id, ...sameCategoryPosts.map((p: any) => p.id)];
    fillPosts = await prisma.blogPost.findMany({
      where: { id: { notIn: excludeIds } },
      orderBy: [{ clickCount: "desc" }, { createdAt: "desc" }],
      take: remainingSlots,
    });
  }

  const suggestedPosts = [...sameCategoryPosts, ...fillPosts].map(mapPostForClient);
  const sidebarTopReads = topReadPosts.map(mapPostForClient);

  return (
    <ArticlePage
      post={mappedPost}
      suggestedPosts={suggestedPosts}
      sidebarTopReads={sidebarTopReads}
      events={events.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        details: e.details,
      }))}
      resources={resources.map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        url: r.url ?? null,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }))}
    />
  );
}
