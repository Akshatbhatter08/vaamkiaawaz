import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { initialBlogSeed } from "@/lib/blog-seed";
import { requireAuth } from "@/lib/auth";
import { ensureBlogSchema } from "@/lib/db-setup";
import { enrichPostsWithAuthorImages } from "@/lib/authorImages";
import { isValidAuthorImageRef, isValidImageRef } from "@/lib/fileStorage";
import { extractFirstImageFromHtml } from "@/lib/postImage";
import { enrichPostsWithThumbnails } from "@/lib/postImageEnrich";

const mapBlog = (post: {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  postImage: string | null;
  imageFocus?: string | null;
  authorImage: string | null;
  clickCount: number;
  uploaderName?: string | null;
  createdAt: Date;
}) => {
  return {
    id: post.id,
    category: post.category,
    title: post.title,
    excerpt: post.excerpt,
    content: "", // Content intentionally omitted for speed
    author: post.author,
    postImage: post.postImage,
    imageFocus: post.imageFocus ?? null,
    authorImage: post.authorImage,
    clickCount: post.clickCount,
    uploaderName: post.uploaderName ?? null,
    createdAt: post.createdAt.toISOString(),
  };
};

export async function GET() {
  try {
    await ensureBlogSchema();
    const count = await prisma.blogPost.count().catch(() => 0);
    if (count === 0) {
      await prisma.blogPost.createMany({
        data: initialBlogSeed.map((post) => ({
          category: post.category,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          author: post.author,
        })),
      });
    }

    const posts = await enrichPostsWithThumbnails(
      await enrichPostsWithAuthorImages(
        await prisma.blogPost.findMany({
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
          take: 100,
        }),
      ),
    );

    const topPosts = await enrichPostsWithThumbnails(
      await enrichPostsWithAuthorImages(
        await prisma.blogPost.findMany({
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
        }),
      ),
    );

    return NextResponse.json(
      { posts: posts.map(mapBlog), topPosts: topPosts.map(mapBlog) },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err: any) {
    console.error("GET /api/blogs error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBlogSchema();
  } catch (err) {
    console.error("ensureBlogSchema failed:", err);
  }

  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) return authPayload;
  const userId = authPayload.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, active: true, permissions: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const permissions = (user.permissions ?? {}) as Partial<Record<"publishBlog", boolean>>;
  const canPublish =
    user.role === "MASTER_ADMIN" ||
    (user.role === "ADMIN" && permissions.publishBlog === true) ||
    (user.role === "CONTRIBUTOR" && user.active);

  if (!canPublish) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    category?: string;
    title?: string;
    excerpt?: string;
    content?: string;
    author?: string;
    postImage?: string;
    imageFocus?: string;
    authorImage?: string;
  };

  const category = body.category?.trim() || "ब्लॉग";
  const title = body.title?.trim();
  const excerpt = body.excerpt?.trim();
  const content = body.content?.trim();
  const author = body.author?.trim();
  const explicitPostImage = body.postImage?.trim() || null;
  let postImage = explicitPostImage;
  if (!postImage && content) {
    const extracted = extractFirstImageFromHtml(content);
    if (extracted && isValidImageRef(extracted)) {
      postImage = extracted;
    }
  }
  const authorImage = null;
  const imageFocus = body.imageFocus?.trim() || null;

  if (!title || !excerpt || !content || !author) {
    return NextResponse.json({ error: "शीर्षक, सारांश, पूरा लेख और लेखक आवश्यक हैं।" }, { status: 400 });
  }

  if (explicitPostImage && !isValidImageRef(explicitPostImage)) {
    return NextResponse.json({ error: "पोस्ट फोटो का फ़ॉर्मेट अमान्य है।" }, { status: 400 });
  }

  if (body.authorImage?.trim() && !isValidAuthorImageRef(body.authorImage.trim())) {
    return NextResponse.json({ error: "लेखक फोटो का फ़ॉर्मेट अमान्य है।" }, { status: 400 });
  }

  let parsedPermissions: any = {};
  if (typeof user.permissions === "string") {
    try { parsedPermissions = JSON.parse(user.permissions); } catch (e) {}
  } else if (user.permissions && typeof user.permissions === "object") {
    parsedPermissions = user.permissions;
  }

  const uploaderName = 
    (typeof parsedPermissions.authorName === 'string' ? parsedPermissions.authorName.trim() : null) || 
    (user.role === 'MASTER_ADMIN' ? 'केशव कुमार भट्टड़' : 'अज्ञात');

  const created = await prisma.blogPost.create({
    data: { 
      category, 
      title, 
      excerpt, 
      content, 
      author, 
      postImage, 
      imageFocus,
      authorImage,
      authorUserId: userId,
      uploaderName: uploaderName
    },
  });

  if (created.content.trim() !== content) {
    await prisma.blogPost.delete({ where: { id: created.id } });
    return NextResponse.json(
      { error: "पूरा लेख सेव नहीं हो सका। डेटाबेस स्कीमा अपडेट करें और फिर से प्रकाशित करें।" },
      { status: 500 },
    );
  }

  // Trigger Make.com Webhook for Automation
  try {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (webhookUrl) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vaamkiaawaz.com';
      const postUrl = `${siteUrl}/post/${created.id}`;
      
      // Sending webhook without awaiting so it doesn't block the response
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: created.title,
          excerpt: created.excerpt,
          url: postUrl,
          author: created.author,
          category: created.category,
        })
      }).catch(err => console.error("Make.com Webhook failed:", err));
    }
  } catch (error) {
    console.error("Make.com Webhook error:", error);
  }

  const enriched = await enrichPostsWithAuthorImages([created]);
  return NextResponse.json({ post: mapBlog(enriched[0]) }, { status: 201 });
}
