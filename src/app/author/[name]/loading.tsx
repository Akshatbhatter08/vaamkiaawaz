import AuthorPageSkeleton from "@/components/skeletons/AuthorPageSkeleton";

export default function Loading() {
  return (
    <div className="print:hidden news-shell min-h-screen">
      <main className="min-h-screen" style={{ background: "var(--ink)", color: "var(--text-primary)" }}>
        <div className="mx-auto w-full" style={{ maxWidth: 1280, padding: "24px" }}>
          <AuthorPageSkeleton />
        </div>
      </main>
    </div>
  );
}
