import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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
  return "/vaamki-logo.png";
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

  return {
    title: `${post.title} — वाम की आवाज़`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
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
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

/**
 * This page exists only to serve rich OG meta tags to crawlers.
 * Real users are immediately redirected to the homepage where the
 * client-side modal opens the article via the `?post=` query param.
 */
export default async function PostPage({ params }: Props) {
  const { id } = await params;
  redirect(`/?post=${encodeURIComponent(id)}`);
}
