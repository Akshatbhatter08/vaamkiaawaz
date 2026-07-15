import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { enrichPostsWithAuthorImages } from "@/lib/authorImages";
import { postAuthorMatchesUser } from "@/lib/penName";
import { isValidMediaImageUrl } from "@/lib/fileStorage";
import { extractFirstImageFromHtml } from "@/lib/postImage";
import { getContributorCodeFromPermissions, parseUserPermissions } from "@/lib/contributorCode";
import {
  MAX_BLOG_CONTENT_LENGTH,
  MAX_BLOG_EXCERPT_LENGTH,
  MAX_BLOG_TITLE_LENGTH,
  sanitizeExcerptHtml,
  sanitizeTipTapHtml,
} from "@/lib/tiptapSanitize";

type Context = {
  params: Promise<{ id: string }>;
};

const mapBlog = (post: {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  postImage: string | null;
  imageFocus?: string | null;
  imageFocusHero?: string | null;
  imageFocusGround?: string | null;
  authorImage: string | null;
  clickCount: number;
  uploaderName?: string | null;
  authorUserId?: string | null;
  createdAt: Date;
}) => ({
  id: post.id,
  category: post.category,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  author: post.author,
  postImage: post.postImage,
  imageFocus: post.imageFocus ?? null,
  imageFocusHero: post.imageFocusHero ?? null,
  imageFocusGround: post.imageFocusGround ?? null,
  authorImage: post.authorImage,
  clickCount: post.clickCount,
  uploaderName: post.uploaderName ?? null,
  authorUserId: post.authorUserId ?? null,
  createdAt: post.createdAt.toISOString(),
});

/** GET /api/blogs/[id] — Fetch a single blog post by ID */
export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post || post.isHidden) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const [enriched] = await enrichPostsWithAuthorImages([post]);
    return NextResponse.json({ post: mapBlog(enriched) });
  } catch (err) {
    console.error("GET /api/blogs/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/blogs/[id] — Edit a blog post.
 * Allowed only for: Master Admin OR the original author (matched by author name from user permissions).
 */
export async function PATCH(request: NextRequest, context: Context) {
  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) return authPayload;

  const userId = authPayload.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, permissions: true, id: true, active: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role === "CONTRIBUTOR" && !user.active) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, author: true, authorUserId: true, uploaderName: true, content: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Determine if user can edit this post
  let parsedPermissions: any = {};
  if (typeof user.permissions === "string") {
    try { parsedPermissions = JSON.parse(user.permissions); } catch (e) {}
  } else if (user.permissions && typeof user.permissions === "object") {
    parsedPermissions = user.permissions;
  }

  const isMaster = user.role === "MASTER_ADMIN";
  const isPostAuthor =
    postAuthorMatchesUser(parsedPermissions, existing.author) ||
    existing.authorUserId === userId;
  if (!isMaster && !isPostAuthor) {
    return NextResponse.json(
      {
        error:
          "इस लेख को केवल मास्टर एडमिन या इसके लेखक ही संपादित कर सकते हैं।",
      },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    title?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    postImage?: string | null;
    imageFocus?: string | null;
    imageFocusHero?: string | null;
    imageFocusGround?: string | null;
  };

  const updateData: Record<string, unknown> = {};
  if (body.title?.trim()) {
    const title = body.title.trim();
    if (title.length > MAX_BLOG_TITLE_LENGTH) {
      return NextResponse.json({ error: "शीर्षक बहुत लंबा है।" }, { status: 400 });
    }
    updateData.title = title;
  }
  if (body.excerpt?.trim()) {
    const excerpt = body.excerpt.trim();
    if (excerpt.length > MAX_BLOG_EXCERPT_LENGTH) {
      return NextResponse.json({ error: "सारांश बहुत लंबा है।" }, { status: 400 });
    }
    updateData.excerpt = sanitizeExcerptHtml(excerpt);
  }
  if (body.content?.trim()) {
    const content = body.content.trim();
    if (content.length > MAX_BLOG_CONTENT_LENGTH) {
      return NextResponse.json({ error: "लेख बहुत लंबा है।" }, { status: 400 });
    }
    updateData.content = sanitizeTipTapHtml(content);
  }
  if (body.category?.trim()) updateData.category = body.category.trim();
  
  if (body.postImage !== undefined) {
    const explicitPostImage = body.postImage?.trim() || null;
    let postImage = explicitPostImage;
    if (!postImage) {
      const contentSource =
        typeof updateData.content === "string"
          ? updateData.content
          : existing.content;
      const extracted = extractFirstImageFromHtml(contentSource);
      if (extracted && isValidMediaImageUrl(extracted)) {
        postImage = extracted;
      }
    }
    if (explicitPostImage && !isValidMediaImageUrl(explicitPostImage)) {
      return NextResponse.json({ error: "पोस्ट फोटो के लिए मीडिया URL आवश्यक है (data: URI नहीं)।" }, { status: 400 });
    }
    updateData.postImage = postImage;
  }

  if (body.imageFocus !== undefined) {
    updateData.imageFocus = body.imageFocus?.trim() || null;
  }
  if (body.imageFocusHero !== undefined) {
    updateData.imageFocusHero = body.imageFocusHero?.trim() || null;
  }
  if (body.imageFocusGround !== undefined) {
    updateData.imageFocusGround = body.imageFocusGround?.trim() || null;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "कम से कम एक फ़ील्ड अपडेट करें।" },
      { status: 400 }
    );
  }

  const updated = await prisma.blogPost.update({
    where: { id },
    data: updateData,
  });

  const [enriched] = await enrichPostsWithAuthorImages([updated]);
  return NextResponse.json({ post: mapBlog(enriched) });
}

export async function DELETE(request: NextRequest, context: Context) {
  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) return authPayload;

  const userId = authPayload.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, permissions: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await context.params;
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, uploaderName: true, authorUserId: true, isHidden: true },
  });

  if (!existing || existing.isHidden) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const parsedPermissions = parseUserPermissions(user.permissions);
  const userContributorCode = getContributorCodeFromPermissions(parsedPermissions).toLowerCase();
  const postUploaderName = existing.uploaderName?.trim().toLowerCase() || "";
  const userAuthorName =
    typeof parsedPermissions.authorName === "string"
      ? parsedPermissions.authorName.trim().toLowerCase()
      : "";

  const isMaster = user.role === "MASTER_ADMIN";
  const isUploader =
    existing.authorUserId === userId ||
    (userContributorCode.length > 0 && userContributorCode === postUploaderName) ||
    (userAuthorName.length > 0 && userAuthorName === postUploaderName);

  if (!isMaster && !isUploader) {
    return NextResponse.json(
      { error: "केवल मास्टर एडमिन या अपलोडर ही लेख हटा सकते हैं।" },
      { status: 403 }
    );
  }

  await prisma.blogPost.update({ where: { id }, data: { isHidden: true } });
  revalidatePath("/");
  revalidatePath(`/post/${id}`);
  return NextResponse.json({ success: true });
}
