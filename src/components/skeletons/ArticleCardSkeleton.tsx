import { Skeleton } from "@/components/ui/skeleton";

export function ArticleCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: "var(--surface-mid)",
        border: "1px solid var(--divider)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Skeleton className="aspect-video w-full rounded-none" />
      <div style={{ padding: 14, display: "flex", flexDirection: "column", flexGrow: 1, gap: 8 }}>
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: 10 }}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
