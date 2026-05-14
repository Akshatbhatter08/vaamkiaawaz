import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import React from "react";

export function StaticPageLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--foreground)] theme-light">
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline font-medium">होम पेज पर लौटें</span>
          </Link>
          <div className="h-6 w-px bg-[var(--line)]"></div>
          <Link href="/" className="flex items-center gap-3">
            <img src="/vaamki-logo.png" alt="वाम की आवाज़" className="h-8 w-8 rounded object-cover bg-white" />
            <span className="font-serif text-lg font-bold text-[var(--headline)]">वाम की आवाज़</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-serif prose-headings:text-[var(--headline)] prose-p:text-[var(--muted)] prose-a:text-[var(--primary)]">
          <h1 className="mb-8 font-serif text-3xl font-bold tracking-tight text-[var(--headline)] sm:text-4xl">{title}</h1>
          <div className="space-y-6 text-base leading-relaxed sm:text-lg sm:leading-8">
            {children}
          </div>
        </article>
      </main>

      <footer className="mt-12 border-t border-[var(--line)] bg-[var(--surface-soft)] py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-[var(--muted)] sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} वाम की आवाज़ • जन समाचार मंच</p>
        </div>
      </footer>
    </div>
  );
}
