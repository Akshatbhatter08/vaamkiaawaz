import { prisma } from "@/lib/prisma";
import { readingTime } from "@/utils/designUtils";

export type BlogPostCard = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  postImage: string | null;
  imageFocus: string | null;
  imageFocusHero: string | null;
  imageFocusGround: string | null;
  clickCount: number;
  readTime: number;
  createdAt: string;
};

export async function fetchBlogPostCards(ids: string[]): Promise<BlogPostCard[]> {
  if (ids.length === 0) return [];

  const posts = await prisma.blogPost.findMany({
    where: {
      id: { in: ids },
      isHidden: false,
    },
    select: {
      id: true,
      category: true,
      title: true,
      excerpt: true,
      content: true,
      author: true,
      postImage: true,
      imageFocus: true,
      imageFocusHero: true,
      imageFocusGround: true,
      clickCount: true,
      createdAt: true,
    },
  });

  const byId = new Map(
    posts.map((post) => [
      post.id,
      {
        id: post.id,
        category: post.category,
        title: post.title,
        excerpt: post.excerpt,
        author: post.author,
        postImage: post.postImage,
        imageFocus: post.imageFocus ?? null,
        imageFocusHero: post.imageFocusHero ?? null,
        imageFocusGround: post.imageFocusGround ?? null,
        clickCount: post.clickCount,
        readTime: readingTime(post.content || post.excerpt || ""),
        createdAt: post.createdAt.toISOString(),
      } satisfies BlogPostCard,
    ]),
  );

  return ids.map((id) => byId.get(id)).filter((post): post is BlogPostCard => !!post);
}
