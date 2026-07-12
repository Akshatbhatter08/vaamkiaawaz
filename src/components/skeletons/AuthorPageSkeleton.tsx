import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCardSkeleton } from "@/components/skeletons/ArticleCardSkeleton";

export default function AuthorPageSkeleton() {
  return (
    <div className="mt-4" aria-busy="true" aria-label="लेखक पृष्ठ लोड हो रहा है">
      <section className="author-hero">
        <div className="author-hero__identity">
          <Skeleton className="author-hero__avatar rounded-full" style={{ width: 108, height: 108 }} />
          <Skeleton className="mb-2 h-9 w-48" />
          <Skeleton className="mb-2 h-4 w-36" />
          <Skeleton className="mb-4 h-3 w-40" />
          <div className="author-hero__icons mb-4 flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div>
          <div className="space-y-2" style={{ marginBottom: 32 }}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="author-stats">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="author-stat-card">
                <Skeleton className="mb-3 h-3 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ marginBottom: 24 }}>
        <Skeleton className="mb-3 h-3 w-24" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20" />
          ))}
        </div>
      </div>

      <div
        className="article-filter-bar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 0",
          marginBottom: 24,
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="main-sidebar-grid">
        <div>
          <Skeleton className="mb-4 h-7 w-44" />
          <div className="opinion-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ border: "1px solid var(--divider)", background: "var(--surface-mid)", padding: 16 }}>
            <Skeleton className="mb-3 h-3 w-32" />
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>

          <div>
            <Skeleton className="mb-4 h-3 w-28" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="mb-4 h-3 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <Skeleton className="h-6 w-6 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
