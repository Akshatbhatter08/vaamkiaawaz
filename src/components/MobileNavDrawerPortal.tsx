"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type MobileNavDrawerPortalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** Portaled full-screen mobile nav. Renders only while open — no exit animation, no ghost overlay. */
export function MobileNavDrawerPortal({ open, onClose, children }: MobileNavDrawerPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div
      className="mobile-nav-drawer fixed inset-0 z-[100] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="नेविगेशन"
    >
      <button
        type="button"
        className="mobile-nav-drawer__backdrop absolute inset-0 border-none bg-black/45 p-0"
        onClick={onClose}
        aria-label="मेनू बंद करें"
      />
      <aside className="mobile-nav-drawer__panel relative z-10 flex h-full w-full flex-col overflow-y-auto overscroll-y-auto border-r border-[var(--line)] bg-[var(--surface)] p-4 shadow-xl">
        {children}
      </aside>
    </div>,
    document.body,
  );
}
