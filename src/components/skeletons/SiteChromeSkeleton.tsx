import { Skeleton } from "@/components/ui/skeleton";
import { SITE_TAGLINE_LINES } from "@/lib/siteConstants";

/** Static brand + nav chrome matching home/article shells while content loads. */
export function SiteChromeSkeleton() {
  return (
    <>
      <div
        className="site-topbar home-topbar hidden min-[450px]:flex flex-wrap items-center justify-between gap-2 border-b border-[var(--divider)] text-xs sm:text-sm"
        style={{ minHeight: 32, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", paddingTop: 4, paddingBottom: 4 }}
        aria-hidden="true"
      >
        <Skeleton className="h-3 w-40" />
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="hidden h-7 w-24 sm:block" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>

      <header className="headline-fade home-header" aria-hidden="true">
        <div className="home-header__slot home-header__slot--left hidden lg:flex gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="home-header__brand">
          <Skeleton
            className="home-header__logo shrink-0"
            style={{ width: 65, height: 65, border: "1px solid var(--divider)" }}
          />
          <div className="home-header__titles">
            <div
              className="home-header__title"
              style={{
                fontFamily: "'Noto Serif Devanagari', serif",
                fontSize: 30,
                fontWeight: 700,
                color: "var(--headline)",
                lineHeight: 1.1,
              }}
            >
              वाम की आवाज़ (Vaam Ki Aawaz)
            </div>
            <div className="home-header__subtitle">
              {SITE_TAGLINE_LINES.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="home-header__slot home-header__slot--right hidden lg:flex">
          <Skeleton className="h-9 w-28" />
        </div>
      </header>

      <nav
        className="home-nav"
        style={{
          background: "var(--ink)",
          borderBottom: "2px solid var(--crimson)",
          padding: "8px 12px",
        }}
        aria-hidden="true"
      >
        <div className="home-nav__inner relative flex flex-row items-center justify-between gap-2 px-1 sm:px-0">
          <div className="home-nav__left flex flex-1 items-center gap-2 pr-2">
            <Skeleton className="h-10 w-24 lg:hidden" />
            <div className="hidden flex-1 gap-1 lg:flex">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-20" />
              ))}
            </div>
          </div>
          <div className="home-nav__actions ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 lg:w-auto lg:flex-none">
            <Skeleton className="hidden h-10 w-[140px] md:block" />
            <Skeleton className="h-10 w-[110px]" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </nav>
    </>
  );
}
