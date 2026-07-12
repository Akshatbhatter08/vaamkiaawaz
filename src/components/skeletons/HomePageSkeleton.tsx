import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCardSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { SiteChromeSkeleton } from "@/components/skeletons/SiteChromeSkeleton";

function LatestCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4" aria-hidden="true">
      <Skeleton className="thumb-16x9 mb-3 w-full rounded-md" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-5 w-full" />
      <Skeleton className="mt-1 h-5 w-4/5" />
      <Skeleton className="mt-2 h-3.5 w-full" />
      <Skeleton className="mt-1 h-3.5 w-3/4" />
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export default function HomePageSkeleton() {
  return (
    <div className="print:hidden news-shell min-h-screen" aria-busy="true" aria-label="पेज लोड हो रहा है">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <SiteChromeSkeleton />

        <section
          className="home-breaking"
          style={{
            height: 36,
            background: "var(--crimson)",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <div
            style={{
              background: "var(--crimson-dark)",
              color: "white",
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 12px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              letterSpacing: "0.04em",
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center",
            }}
          >
            ब्रेकिंग
          </div>
          <div style={{ flex: 1, padding: "0 12px" }}>
            <Skeleton className="h-3 w-3/4 bg-white/25" />
          </div>
        </section>

        <section
          className="hero-section"
          style={{
            position: "relative",
            height: 520,
            overflow: "hidden",
            background: "var(--surface-high)",
            marginTop: 16,
            marginBottom: 16,
          }}
          aria-hidden="true"
        >
          <div className="hero-section__shade" />
          <div
            className="hero-overlay"
            style={{ position: "absolute", bottom: 40, left: 40, right: 16, maxWidth: 620, zIndex: 10 }}
          >
            <Skeleton className="mb-2.5 h-5 w-20 bg-white/20" />
            <Skeleton className="mb-2 h-10 w-full bg-white/25" />
            <Skeleton className="mb-2 h-10 w-5/6 bg-white/25" />
            <Skeleton className="mb-4 h-4 w-full bg-white/15" />
            <Skeleton className="mb-4 h-4 w-2/3 bg-white/15" />
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full bg-white/20" />
              <Skeleton className="h-3 w-24 bg-white/20" />
              <Skeleton className="h-3 w-16 bg-white/20" />
            </div>
            <Skeleton className="h-9 w-28 bg-white/25" />
          </div>
          <div
            className="hero-side-panel"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 272,
              background: "rgba(0,0,0,0.90)",
              borderLeft: "2px solid var(--crimson)",
              zIndex: 15,
            }}
          >
            <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--crimson)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                और खबरें ›
              </span>
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <Skeleton className="mb-2 h-4 w-14 bg-white/15" />
                <Skeleton className="mb-1 h-3.5 w-full bg-white/20" />
                <Skeleton className="mb-2 h-3.5 w-4/5 bg-white/20" />
                <Skeleton className="h-2.5 w-24 bg-white/10" />
              </div>
            ))}
          </div>
        </section>

        <main className="home-main grid grid-cols-1 gap-6 lg:grid-cols-12" aria-hidden="true">
          <section className="home-main__primary space-y-6 lg:col-span-8">
            <section className="home-priorities" style={{ background: "var(--surface)", padding: "8px 0 16px" }}>
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="cards-grid-responsive cards-grid-2up">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ArticleCardSkeleton key={i} />
                ))}
              </div>
            </section>

            <section className="home-latest scroll-m-32 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <LatestCardSkeleton key={i} />
                ))}
              </div>
            </section>

            <section className="home-vichar rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <Skeleton className="mb-4 h-8 w-40" />
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </section>
          </section>

          <aside className="home-aside space-y-6 lg:col-span-4">
            <section className="home-topread rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <Skeleton className="mb-3 h-7 w-48" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex w-full gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3"
                  >
                    <Skeleton className="h-6 w-4" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="home-resources rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-5">
              <Skeleton className="h-7 w-28" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
