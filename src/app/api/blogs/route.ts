import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initialBlogSeed } from "@/lib/blog-seed";

const mapBlog = (post: {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  clickCount: number;
  createdAt: Date;
}) => ({
  id: post.id,
  category: post.category,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  author: post.author,
  clickCount: post.clickCount,
  createdAt: post.createdAt.toISOString(),
});

export async function GET() {
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
    orderBy: [{ clickCount: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ posts: posts.map(mapBlog) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    category?: string;
    title?: string;
    excerpt?: string;
    content?: string;
    author?: string;
  };

  const category = body.category?.trim() || "ब्लॉग";
  const title = body.title?.trim();
  const excerpt = body.excerpt?.trim();
  const content = body.content?.trim();
  const author = body.author?.trim();

  if (!title || !excerpt || !content || !author) {
    return NextResponse.json({ error: "शीर्षक, सारांश, पूरा लेख और लेखक आवश्यक हैं।" }, { status: 400 });
  }

  const created = await prisma.blogPost.create({
    data: { category, title, excerpt, content, author },
  });

  return NextResponse.json({ post: mapBlog(created) }, { status: 201 });
}
