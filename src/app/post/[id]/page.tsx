import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { enrichPostsWithAuthorImages } from "@/lib/authorImages";
import { getContributorCodeFromPermissions, parseUserPermissions } from "@/lib/contributorCode";
import { resolvePostImage, extractFirstImageFromHtml } from "@/lib/postImage";
import { enrichPostsWithThumbnails } from "@/lib/postImageEnrich";
import ArticlePage from "./ArticlePage";

// Use ISR to cache the page for 30 seconds. This is critical for WhatsApp link previews,
// as WhatsApp will time out and show a generic fallback if the server takes too long to respond.
export const revalidate = 30;

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Extract the first image URL from HTML content.
 */
function extractFirstImageFromContent(html: string): string | null {
  return extractFirstImageFromHtml(html);
}

function getOgImage(post: { id: string; postImage: string | null; content: string }): string {
  // Prefer direct disk media URLs. WhatsApp (and many crawlers) often fail when
  // og:image points at /api/image/blog/... which now redirects to /api/media/...
  if (post.postImage?.startsWith("/api/media/")) {
    return post.postImage;
  }

  // 1. Post thumbnail (legacy base64 still needs the binary proxy)
  if (post.postImage) {
    return `/api/image/blog/${post.id}`;
  }

  // 2. First image inside the article content
  const contentImage = extractFirstImageFromContent(post.content);
  if (contentImage?.startsWith("/api/media/")) {
    return contentImage;
  }
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

function mapPostForClient(post: any, keepContent = false, resolvedUploaderName?: string | null) {
  const createdAtIso = post.createdAt
    ? new Date(post.createdAt).toISOString()
    : new Date().toISOString();

  let resolvedImage = resolvePostImage(post.postImage, post.content);

  return {
    id: post.id,
    category: post.category,
    title: post.title,
    excerpt: post.excerpt,
    content: keepContent ? post.content : "", // Fallback empty string if content is intentionally omitted
    author: post.author,
    postImage: resolvedImage,
    imageFocus: post.imageFocus ?? null,
    authorImage: post.authorImage ?? null,
    clickCount: post.clickCount ?? 0,
    uploaderName: resolvedUploaderName ?? post.uploaderName ?? null,
    authorUserId: post.authorUserId ?? null,
    createdAt: createdAtIso,
    time: formatRelativeTime(createdAtIso),
    source: "blog" as const,
  };
}

async function resolveUploaderNameForPost(post: {
  uploaderName: string | null;
  authorUserId: string | null;
}) {
  if (!post.authorUserId) {
    return post.uploaderName;
  }

  const uploader = await prisma.user.findUnique({
    where: { id: post.authorUserId },
    select: { role: true, permissions: true },
  });

  if (!uploader) {
    return post.uploaderName;
  }

  const permissions = parseUserPermissions(uploader.permissions);
  const contributorCode = getContributorCodeFromPermissions(permissions);
  return contributorCode || post.uploaderName;
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
      isHidden: true,
    },
  });

  // Fallback metadata if the post doesn't exist
  if (!post || post.isHidden) {
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

  if (!post || post.isHidden) {
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

  const selectSidebarFields = {
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
  };

  // Run main-post enrichment and all independent sidebar queries in parallel
  const enrichMainPromise = enrichPostsWithAuthorImages([post]);
  const uploaderPromise = resolveUploaderNameForPost(post);

  const sameCategoryPostsPromise = prisma.blogPost.findMany({
    where: { category: post.category, id: { not: post.id }, isHidden: false },
    select: selectSidebarFields,
    orderBy: [{ clickCount: "desc" }, { createdAt: "desc" }],
    take: 3,
  });

  const topReadPostsPromise = prisma.blogPost.findMany({
    where: { isHidden: false },
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
    where: { author: post.author, id: { not: post.id }, isHidden: false },
    select: selectSidebarFields,
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const [
    enrichedMain,
    resolvedUploaderName,
    sameCategoryPostsData,
    topReadPostsData,
    events,
    resources,
    authorPostsData,
  ] = await Promise.all([
    enrichMainPromise,
    uploaderPromise,
    sameCategoryPostsPromise,
    topReadPostsPromise,
    eventsPromise,
    resourcesPromise,
    authorPostsPromise,
  ]);

  const mappedPost = mapPostForClient(enrichedMain[0], true, resolvedUploaderName);

  // If we don't have enough same-category posts, fill with recent popular posts
  const remainingSlots = 4 - sameCategoryPostsData.length;
  let fillPostsData: typeof sameCategoryPostsData = [];
  if (remainingSlots > 0) {
    const excludeIds = [post.id, ...sameCategoryPostsData.map((p: any) => p.id)];
    fillPostsData = await prisma.blogPost.findMany({
      where: { id: { notIn: excludeIds }, isHidden: false },
      select: selectSidebarFields,
      orderBy: [{ clickCount: "desc" }, { createdAt: "desc" }],
      take: remainingSlots,
    });
  }

  const [enrichedSameCategory, enrichedFill, enrichedTopRead, enrichedAuthorPosts] = await Promise.all([
    enrichPostsWithAuthorImages(sameCategoryPostsData).then((p) => enrichPostsWithThumbnails(p)),
    enrichPostsWithAuthorImages(fillPostsData).then((p) => enrichPostsWithThumbnails(p)),
    enrichPostsWithAuthorImages(topReadPostsData).then((p) => enrichPostsWithThumbnails(p)),
    enrichPostsWithAuthorImages(authorPostsData).then((p) => enrichPostsWithThumbnails(p)),
  ]);

  const sameCategoryPosts = enrichedSameCategory.map((p) => mapPostForClient(p, false));
  const suggestedPosts = [...sameCategoryPosts, ...enrichedFill.map((p) => mapPostForClient(p, false))];
  const sidebarTopReads = enrichedTopRead.map((p) => mapPostForClient(p, false));
  const mappedAuthorPosts = enrichedAuthorPosts.map((p) => mapPostForClient(p, false));

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
