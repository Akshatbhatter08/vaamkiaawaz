"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

type NavProgressApi = {
  start: () => void;
  done: () => void;
};

let api: NavProgressApi | null = null;

/** Call before router.push to show progress during the pending phase. */
export function startNavigationProgress() {
  api?.start();
}

/**
 * Thin top progress bar for App Router navigations.
 * Shows immediately on same-origin link clicks / startNavigationProgress(),
 * completes when the pathname changes.
 */
export default function NavigationProgress() {
  const pathname = usePathname();

  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const active = useRef(false);
  const skipFirstPathEffect = useRef(true);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const done = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    clearTimers();
    if (typeof document !== "undefined") {
      document.body.style.cursor = "";
    }
    setWidth(100);
    timers.current.push(
      setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 220),
    );
  }, [clearTimers]);

  const start = useCallback(() => {
    active.current = true;
    clearTimers();
    if (typeof document !== "undefined") {
      document.body.style.cursor = "progress";
    }
    setVisible(true);
    setWidth(12);
    timers.current.push(setTimeout(() => setWidth(35), 80));
    timers.current.push(setTimeout(() => setWidth(55), 400));
    timers.current.push(setTimeout(() => setWidth(72), 1200));
    timers.current.push(setTimeout(() => setWidth(85), 2500));
  }, [clearTimers]);

  useEffect(() => {
    api = { start, done };
    return () => {
      if (api?.start === start) api = null;
    };
  }, [start, done]);

  useEffect(() => {
    if (skipFirstPathEffect.current) {
      skipFirstPathEffect.current = false;
      return;
    }
    done();
  }, [pathname, done]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        start();
      } catch {
        // ignore malformed href
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  if (!visible && width === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 99999,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 160ms ease",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: "var(--crimson, #B22222)",
          boxShadow: "0 0 8px rgba(178, 34, 34, 0.45)",
          transition: width === 100 ? "width 160ms ease" : "width 400ms ease",
        }}
      />
    </div>
  );
}
