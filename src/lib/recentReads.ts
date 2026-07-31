/* Device-local reading history — keyed by post id, newest first. */

const RECENT_READS_KEY = "vaamki-recent-reads";
const MAX_RECENT = 50;

type RecentReadEntry = { id: string; at: number };

function readEntries(): RecentReadEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_READS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentReadEntry =>
        !!item &&
        typeof item === "object" &&
        typeof (item as RecentReadEntry).id === "string" &&
        typeof (item as RecentReadEntry).at === "number",
    );
  } catch {
    return [];
  }
}

export function recordRecentRead(postId: string) {
  if (typeof window === "undefined") return;
  const id = postId.trim();
  if (!id) return;
  try {
    const now = Date.now();
    const next = [{ id, at: now }, ...readEntries().filter((entry) => entry.id !== id)].slice(
      0,
      MAX_RECENT,
    );
    localStorage.setItem(RECENT_READS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

export function getRecentReadIds(): string[] {
  return readEntries().map((entry) => entry.id);
}
