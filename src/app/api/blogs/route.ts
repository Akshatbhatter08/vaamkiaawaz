import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { initialBlogSeed } from "@/lib/blog-seed";
import { requireAuth } from "@/lib/auth";

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
  createdAt: post.createdAt.toISOString(),
});

type BlogColumnMeta = {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: "YES" | "NO";
};

let ensureBlogSchemaPromise: Promise<void> | null = null;

const ensureBlogPostStorageColumns = async () => {
  const columns = await prisma.$queryRawUnsafe<BlogColumnMeta[]>(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'BlogPost'
      AND COLUMN_NAME IN ('title', 'excerpt', 'content', 'postImage', 'authorImage')
  `);

  const byName = new Map(columns.map((item) => [item.COLUMN_NAME, item]));
  const title = byName.get("title");
  const excerpt = byName.get("excerpt");
  const content = byName.get("content");
  const postImage = byName.get("postImage");
  const authorImage = byName.get("authorImage");

  if (!title || !excerpt || !content) {
    throw new Error("BlogPost table is missing required columns.");
  }

  const textTypes = new Set(["text", "mediumtext", "longtext"]);
  const alterOps: string[] = [];

  if (!textTypes.has(title.DATA_TYPE.toLowerCase()) || title.IS_NULLABLE !== "NO") {
    alterOps.push("MODIFY `title` TEXT NOT NULL");
  }

  if (!textTypes.has(excerpt.DATA_TYPE.toLowerCase()) || excerpt.IS_NULLABLE !== "NO") {
    alterOps.push("MODIFY `excerpt` TEXT NOT NULL");
  }

  if (content.DATA_TYPE.toLowerCase() !== "longtext" || content.IS_NULLABLE !== "NO") {
    alterOps.push("MODIFY `content` LONGTEXT NOT NULL");
  }

  if (!postImage) {
    alterOps.push("ADD COLUMN `postImage` LONGTEXT NULL");
  } else if (postImage.DATA_TYPE.toLowerCase() !== "longtext") {
    alterOps.push("MODIFY `postImage` LONGTEXT NULL");
  }

  if (!authorImage) {
    alterOps.push("ADD COLUMN `authorImage` LONGTEXT NULL");
  } else if (authorImage.DATA_TYPE.toLowerCase() !== "longtext") {
    alterOps.push("MODIFY `authorImage` LONGTEXT NULL");
  }

  if (alterOps.length === 0) {
    return;
  }

  await prisma.$executeRawUnsafe(`ALTER TABLE \`BlogPost\` ${alterOps.join(", ")}`);
};

const ensureBlogSchema = async () => {
  if (!ensureBlogSchemaPromise) {
    ensureBlogSchemaPromise = ensureBlogPostStorageColumns().catch((error) => {
      ensureBlogSchemaPromise = null;
      throw error;
    });
  }
  await ensureBlogSchemaPromise;
};

export async function GET() {
  try {
    await ensureBlogSchema();
  } catch {
    return NextResponse.json({ error: "डेटाबेस स्कीमा असंगत है।" }, { status: 500 });
  }
  const count = await prisma.blogPost.count();
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

  const posts = await prisma.blogPost.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(
    { posts: posts.map(mapBlog) },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    await ensureBlogSchema();
  } catch {
    return NextResponse.json(
      { error: "डेटाबेस में लेख स्टोर करने का फ़ील्ड गलत है। कृपया DB user को ALTER permission दें और फिर से प्रयास करें।" },
      { status: 500 },
    );
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
    authorImage?: string;
  };

  const category = body.category?.trim() || "ब्लॉग";
  const title = body.title?.trim();
  const excerpt = body.excerpt?.trim();
  const content = body.content?.trim();
  const author = body.author?.trim();
  const postImage = body.postImage?.trim() || null;
  const authorImage = body.authorImage?.trim() || null;

  if (!title || !excerpt || !content || !author) {
    return NextResponse.json({ error: "शीर्षक, सारांश, पूरा लेख और लेखक आवश्यक हैं।" }, { status: 400 });
  }

  if (postImage && !postImage.startsWith("data:image/")) {
    return NextResponse.json({ error: "पोस्ट फोटो का फ़ॉर्मेट अमान्य है।" }, { status: 400 });
  }

  if (authorImage && !authorImage.startsWith("data:image/")) {
    return NextResponse.json({ error: "लेखक फोटो का फ़ॉर्मेट अमान्य है।" }, { status: 400 });
  }

  const created = await prisma.blogPost.create({
    data: { category, title, excerpt, content, author, postImage, authorImage },
  });

  if (created.content.trim() !== content) {
    await prisma.blogPost.delete({ where: { id: created.id } });
    return NextResponse.json(
      { error: "पूरा लेख सेव नहीं हो सका। डेटाबेस स्कीमा अपडेट करें और फिर से प्रकाशित करें।" },
      { status: 500 },
    );
  }

  return NextResponse.json({ post: mapBlog(created) }, { status: 201 });
}
