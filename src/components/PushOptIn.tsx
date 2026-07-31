"use client";

/* Anonymous breaking-news push opt-in. Keyed to the same vaamki-visitor-id the फीड uses, and it
   ships the localStorage affinity snapshot along at subscribe time (the server never sees it
   otherwise). Renders as one bottom sheet at every breakpoint — Web Push is not mobile-specific. */

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import { getVisitorId, readAffinity } from "@/lib/feedAffinity";

const DISMISSED_KEY = "vaamki-push-dismissed-at";
const VIEWS_KEY = "vaamki-push-views";
const DISMISS_DAYS = 30;
const PROMPT_AFTER_VIEWS = 2;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export default function PushOptIn() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!pushSupported()) return;
    if (Notification.permission !== "default") return;

    try {
      const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

      const views = Number(localStorage.getItem(VIEWS_KEY) || 0) + 1;
      localStorage.setItem(VIEWS_KEY, String(views));
      if (views >= PROMPT_AFTER_VIEWS) setVisible(true);
    } catch {
      /* storage unavailable (private mode) — just skip the prompt */
    }
  }, [pathname]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  const allow = useCallback(async () => {
    setBusy(true);
    setStatus("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        dismiss();
        return;
      }

      const keyRes = await fetch("/api/push/subscribe", { cache: "no-store" });
      if (!keyRes.ok) throw new Error("vapid key unavailable");
      const { publicKey } = (await keyRes.json()) as { publicKey?: string };
      if (!publicKey) throw new Error("vapid key missing");

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: getVisitorId(),
          subscription: subscription.toJSON(),
          affinity: readAffinity(),
        }),
      });
      if (!res.ok) throw new Error("subscribe failed");

      try {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      setVisible(false);
    } catch {
      setStatus("सूचना चालू नहीं हो सकी। कृपया बाद में प्रयास करें।");
    } finally {
      setBusy(false);
    }
  }, [dismiss]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[190] flex justify-center p-3 sm:p-4">
      <div className="flex w-full max-w-md items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-2xl">
        <span className="mt-0.5 text-[var(--primary)]">
          <Bell className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base font-bold text-[var(--headline)]">
            ब्रेकिंग न्यूज़ की सूचना पाएं?
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            आपकी पसंद की श्रेणियों की बड़ी खबरें सीधे आपके ब्राउज़र पर।
          </p>
          {status && <p className="mt-2 text-sm text-red-600">{status}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void allow()}
              disabled={busy}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "चालू हो रहा है..." : "हां, भेजें"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold hover:border-[var(--primary)]"
            >
              अभी नहीं
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="बंद करें"
          className="text-[var(--muted)] hover:text-[var(--headline)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
