"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function GoToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-[90] inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] shadow-lg transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
      aria-label="ऊपर जाएं"
      title="ऊपर जाएं"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
