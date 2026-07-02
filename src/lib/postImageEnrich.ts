import { prisma } from "./prisma";
import { extractFirstImageFromHtml } from "./postImage";

export async function enrichPostsWithThumbnails<
  T extends { id: string; postImage: string | null; content?: string | null },
>(posts: T[]): Promise<T[]> {
  const contentById = new Map<string, string>();

  for (const post of posts) {
    if (!post.postImage?.trim() && post.content) {
      contentById.set(post.id, post.content);
    }
  }

  const missingIds = posts
    .filter((post) => !post.postImage?.trim() && !contentById.has(post.id))
    .map((post) => post.id);

  if (missingIds.length > 0) {
    const rows = await prisma.blogPost.findMany({
      where: { id: { in: missingIds } },
      select: { id: true, content: true },
    });
    for (const row of rows) {
      contentById.set(row.id, row.content);
    }
  }

  return posts.map((post) => {
    if (post.postImage?.trim()) return post;
    const extracted = extractFirstImageFromHtml(contentById.get(post.id));
    return extracted ? { ...post, postImage: extracted } : post;
  });
}
