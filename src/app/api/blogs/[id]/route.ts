import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post: mapBlog(post) });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
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
    select: { role: true, permissions: true, id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await context.params;
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, author: true, authorUserId: true, uploaderName: true },
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

  const userAuthorName =
    typeof parsedPermissions.authorName === "string"
      ? parsedPermissions.authorName.trim().toLowerCase()
      : "";
  const postAuthorName = existing.author.trim().toLowerCase();
  const postUploaderName = existing.uploaderName?.trim().toLowerCase() || "";
  const isMaster = user.role === "MASTER_ADMIN";
  const isPostAuthor =
    userAuthorName.length > 0 && userAuthorName === postAuthorName;
  const isUploader =
    userAuthorName.length > 0 && userAuthorName === postUploaderName;

  if (!isMaster && !isPostAuthor && !isUploader) {
    return NextResponse.json(
      {
        error:
          "इस लेख को केवल मास्टर एडमिन, इसके लेखक या अपलोडकर्ता ही संपादित कर सकते हैं।",
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
  };

  const updateData: Record<string, unknown> = {};
  if (body.title?.trim()) updateData.title = body.title.trim();
  if (body.excerpt?.trim()) updateData.excerpt = body.excerpt.trim();
  if (body.content?.trim()) updateData.content = body.content.trim();
  if (body.category?.trim()) updateData.category = body.category.trim();
  
  if (body.postImage !== undefined) {
    let postImage = body.postImage?.trim() || null;
    if (!postImage && updateData.content) {
      const match = (updateData.content as string).match(/<img[^>]+src=["']([^"']+)["']/i);
      postImage = match ? match[1] : null;
    }
    updateData.postImage = postImage;
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

  return NextResponse.json({ post: mapBlog(updated) });
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
    select: { id: true, uploaderName: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  let parsedPermissions: any = {};
  if (typeof user.permissions === "string") {
    try { parsedPermissions = JSON.parse(user.permissions); } catch (e) {}
  } else if (user.permissions && typeof user.permissions === "object") {
    parsedPermissions = user.permissions;
  }

  const userAuthorName =
    typeof parsedPermissions.authorName === "string"
      ? parsedPermissions.authorName.trim().toLowerCase()
      : "";
  const postUploaderName = existing.uploaderName?.trim().toLowerCase() || "";

  const isMaster = user.role === "MASTER_ADMIN";
  const isUploader = userAuthorName.length > 0 && userAuthorName === postUploaderName;

  if (!isMaster && !isUploader) {
    return NextResponse.json(
      { error: "केवल मास्टर एडमिन या अपलोडर ही लेख हटा सकते हैं।" },
      { status: 403 }
    );
  }

  await prisma.blogPost.update({ where: { id }, data: { isHidden: true } });
  return NextResponse.json({ success: true });
}
