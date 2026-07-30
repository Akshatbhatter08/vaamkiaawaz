/* फीड personalisation — entirely device-local. The anonymous id reuses the same
   localStorage key as ArticleEngagement's visitor id, and the affinity counter is a
   disposable JSON blob beside it. Nothing here is sent to or stored on the server. */

const VISITOR_KEY = "vaamki-visitor-id";
const AFFINITY_KEY = "vaamki-feed-affinity";

export const CLICK_WEIGHT = 1;
export const SAVE_WEIGHT = 3;

export type CategoryAffinity = Record<string, number>;

export function getVisitorId() {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function readAffinity(): CategoryAffinity {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(AFFINITY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: CategoryAffinity = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function recordAffinity(category: string | undefined | null, weight: number) {
  if (typeof window === "undefined") return;
  const name = (category || "").trim();
  if (!name) return;
  try {
    getVisitorId();
    const current = readAffinity();
    current[name] = (current[name] || 0) + weight;
    localStorage.setItem(AFFINITY_KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable (private mode / quota) — personalisation just stays off */
  }
}

/* Efraimidis–Spirakis weighted sampling: one random key per item, sorted descending.
   Picked over a strict affinity sort so a strong affinity biases the order without
   locking the feed to a single category. */
export function weightedShuffle<T>(items: T[], weightOf: (item: T) => number): T[] {
  return items
    .map((item) => {
      const weight = Math.max(0.0001, weightOf(item));
      return { item, key: Math.pow(Math.random(), 1 / weight) };
    })
    .sort((a, b) => b.key - a.key)
    .map((entry) => entry.item);
}

/** Affinity score turned into a sampling weight; 1 is the neutral/cold-start value. */
export function affinityWeight(affinity: CategoryAffinity, category: string | undefined | null) {
  const score = affinity[(category || "").trim()] || 0;
  return 1 + score;
}
