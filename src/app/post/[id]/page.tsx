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

function getOgImage(post: { id: string; postImage: string | null; content: string }): string {
  // 1. Post thumbnail
  if (post.postImage) {
    return `/api/image/blog/${post.id}`;
  }

  // 2. First image inside the article content
  const contentImage = extractFirstImageFromContent(post.content);
  if (contentImage) {
    return `/api/image/blog/${post.id}`;
  }

  // 3. Fallback to large website logo
  return "/fbpage.png";
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

function mapPostForClient(post: any, keepContent = false) {
  const createdAtIso = post.createdAt
    ? new Date(post.createdAt).toISOString()
    : new Date().toISOString();

  let resolvedImage = post.postImage;
  if (!resolvedImage && post.content) {
    const match = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    resolvedImage = match ? match[1] : null;
  }

  return {
    id: post.id,
    category: post.category,
    title: post.title,
    excerpt: post.excerpt,
    content: keepContent ? post.content : "", // Fallback empty string if content is intentionally omitted
    author: post.author,
    postImage: resolvedImage,
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
      id: true,
      title: true,
      excerpt: true,
      content: true,
      postImage: true,
      author: true,
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
  const absoluteOgImage = ogImage.startsWith("http") ? ogImage : `https://vaamkiaawaz.in${ogImage.startsWith("/") ? "" : "/"}${ogImage}`;
  const plainExcerpt = (post.excerpt || "").replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
  const metaDescription = `${plainExcerpt} | लेखक: ${post.author} — वाम की आवाज़`;

  const maxOgTitleLen = 70;
  let ogTitle = `${post.title}। वाम की आवाज`;
  if (post.title.length > maxOgTitleLen) {
    ogTitle = `${post.title.substring(0, maxOgTitleLen).trim()}... । वाम की आवाज`;
  }

  return {
    title: `${post.title} | वाम की आवाज़ | जन समाचार मंच`,
    description: metaDescription,
    openGraph: {
      title: ogTitle,
      description: metaDescription,
      siteName: "वाम की आवाज़ — विकल्प की डिजिटल दुनिया",
      url: `https://vaamkiaawaz.in/post/${id}`,
      images: [
        {
          url: absoluteOgImage,
          alt: post.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: metaDescription,
      images: [absoluteOgImage],
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

  const mappedPost = mapPostForClient(post, true);

  const selectSidebarFields = {
    id: true,
    category: true,
    title: true,
    excerpt: true,
    author: true,
    postImage: true,
    authorImage: true,
    clickCount: true,
    uploaderName: true,
    createdAt: true,
  };

  // Fire all independent database queries concurrently
  const sameCategoryPostsPromise = prisma.blogPost.findMany({
    where: { category: post.category, id: { not: post.id } },
    select: selectSidebarFields,
    orderBy: [{ clickCount: "desc" }, { createdAt: "desc" }],
    take: 3,
  });

  const topReadPostsPromise = prisma.blogPost.findMany({
    select: selectSidebarFields,
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

  const authorPostsPromise = prisma.blogPost.findMany({
    where: { author: post.author, id: { not: post.id } },
    select: selectSidebarFields,
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  // Wait for all concurrent queries
  const [sameCategoryPostsData, topReadPostsData, events, resources, authorPostsData] = await Promise.all([
    sameCategoryPostsPromise,
    topReadPostsPromise,
    eventsPromise,
    resourcesPromise,
    authorPostsPromise
  ]);

  // If we don't have enough same-category posts, fill with recent popular posts
  const remainingSlots = 4 - sameCategoryPostsData.length;
  let fillPosts: any[] = [];
  if (remainingSlots > 0) {
    const excludeIds = [post.id, ...sameCategoryPostsData.map((p: any) => p.id)];
    const fillResult = await prisma.blogPost.findMany({
      where: { id: { notIn: excludeIds } },
      select: selectSidebarFields,
      orderBy: [{ clickCount: "desc" }, { createdAt: "desc" }],
      take: remainingSlots,
    });
    fillPosts = fillResult.map(p => mapPostForClient(p, false));
  }

  const sameCategoryPosts = sameCategoryPostsData.map(p => mapPostForClient(p, false));
  const suggestedPosts = [...sameCategoryPosts, ...fillPosts];
  const sidebarTopReads = topReadPostsData.map(p => mapPostForClient(p, false));
  const mappedAuthorPosts = authorPostsData.map(p => mapPostForClient(p, false));

  return (
    <ArticlePage
      post={mappedPost}
      suggestedPosts={suggestedPosts}
      sidebarTopReads={sidebarTopReads}
      authorPosts={mappedAuthorPosts}
      events={events.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        details: e.details,
        imageUrl: e.imageUrl,
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
