import { prisma } from "@/lib/prisma";
import { initialBlogSeed } from "@/lib/blog-seed";

let seedPromise: Promise<void> | null = null;

/**
 * Guards concurrent empty-table seed so public GET /api/blogs does not duplicate rows.
 * Uses a process-local singleton plus a count re-check inside the critical section.
 * For multi-instance deploys, prefer a one-time migration/seed script at deploy.
 */
export async function seedInitialBlogsIfEmpty(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await prisma.blogPost.count().catch(() => -1);
      if (count !== 0) return;

      try {
        // MySQL advisory lock — only one session seeds; others wait then no-op.
        await prisma.$executeRawUnsafe(`SELECT GET_LOCK('vka_blog_seed', 10)`);
        try {
          const again = await prisma.blogPost.count().catch(() => -1);
          if (again === 0) {
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
        } finally {
          await prisma.$executeRawUnsafe(`SELECT RELEASE_LOCK('vka_blog_seed')`);
        }
      } catch (error) {
        console.error("Blog seed guard error:", error);
        // Fallback: best-effort createMany (may still race without lock on some hosts)
        const again = await prisma.blogPost.count().catch(() => -1);
        if (again === 0) {
          await prisma.blogPost.createMany({
            data: initialBlogSeed.map((post) => ({
              category: post.category,
              title: post.title,
              excerpt: post.excerpt,
              content: post.content,
              author: post.author,
            })),
          }).catch(console.error);
        }
      }
    })().finally(() => {
      // Keep resolved promise so subsequent requests skip the work
    });
  }
  await seedPromise;
}
