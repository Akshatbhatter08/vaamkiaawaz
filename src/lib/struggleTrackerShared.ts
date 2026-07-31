/* सक्रिय संघर्ष ट्रैकर shapes and status set, kept free of Prisma so client components can import
   them. Server-side storage lives in struggleTracker.ts. */

/** The exact status set the homepage badge styling already knows about. Adding a value here also
    needs a matching badge class in globals.css, so keep it closed. */
export const STRUGGLE_STATUSES = [
  { value: "active", label: "सक्रिय", badgeClass: "badge-active" },
  { value: "strike", label: "हड़ताल", badgeClass: "badge-strike" },
  { value: "success", label: "आंशिक जीत", badgeClass: "badge-success" },
] as const;

export type StruggleStatus = (typeof STRUGGLE_STATUSES)[number]["value"];

export const isStruggleStatus = (value: unknown): value is StruggleStatus =>
  typeof value === "string" && STRUGGLE_STATUSES.some((item) => item.value === value);

export const struggleStatusLabel = (status: string): string =>
  STRUGGLE_STATUSES.find((item) => item.value === status)?.label ?? status;

export type StruggleTrackerEntry = {
  id: string;
  name: string;
  location: string;
  /** "नवंबर 2024" — rendered as "{startDate} से", the same text the hardcoded rows showed. */
  startDate: string;
  /** "2024-11", the value an <input type="month"> in the admin form expects. */
  sinceMonth: string;
  description: string;
  status: StruggleStatus;
  statusLabel: string;
  displayOrder: number;
  isActive: boolean;
};

/** Parses the "YYYY-MM" produced by <input type="month"> into a UTC-midnight first-of-month. */
export const parseSinceMonth = (value: unknown): Date | null => {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
};
