"use client";

import { useLinkStatus } from "next/link";

/** Subtle dim overlay while a parent Next.js Link navigation is pending. */
export function LinkPendingDim({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--ink)",
        opacity: pending ? 0.3 : 0,
        transition: "opacity 160ms ease",
        transitionDelay: pending ? "80ms" : "0ms",
        pointerEvents: "none",
        zIndex: 2,
        borderRadius: "inherit",
      }}
    />
  );
}
