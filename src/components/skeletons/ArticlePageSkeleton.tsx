import { Skeleton } from "@/components/ui/skeleton";
import { SiteChromeSkeleton } from "@/components/skeletons/SiteChromeSkeleton";

export default function ArticlePageSkeleton() {
  return (
    <div className="news-shell min-h-screen" aria-busy="true" aria-label="लेख लोड हो रहा है">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <SiteChromeSkeleton />

        <nav className="flex items-center gap-1.5 py-3" aria-hidden="true">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-16" />
        </nav>

        <main className="grid gap-8 pb-4 lg:grid-cols-12" aria-hidden="true">
          <article className="article-paper lg:col-span-8 min-w-0 h-fit space-y-4 p-5 sm:p-8">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-5/6" />
            <Skeleton className="h-9 w-3/4" />

            <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] pb-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>

            <div className="rounded-xl border-l-4 border-[var(--primary)] bg-[var(--surface-soft)] p-5 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            <Skeleton className="h-[280px] w-full sm:h-[400px]" />

            <div className="space-y-3 pt-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? "w-2/3" : "w-full"}`} />
              ))}
            </div>
          </article>

          <aside className="lg:col-span-4 space-y-6">
            <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <Skeleton className="mb-3 h-5 w-24" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-10" />
                ))}
              </div>
            </section>

            <div className="flex h-[250px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)]">
              <Skeleton className="h-8 w-32" />
            </div>

            <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-3">
              <Skeleton className="mb-2 h-6 w-36" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 border-b border-[var(--line)] pb-3">
                  <Skeleton className="h-14 w-20 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </section>
          </aside>
        </main>

        <section className="pb-8 pt-2" aria-hidden="true">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
