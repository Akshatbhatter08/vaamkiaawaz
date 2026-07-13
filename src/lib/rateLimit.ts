/**
 * In-memory rate limiter for a single Node process (e.g. Hostinger).
 * For multi-instance deploys, swap to Redis/shared store later.
 */

type Bucket = {
  count: number;
  resetAt: number;
  failures: number;
  lockedUntil: number;
};

const buckets = new Map<string, Bucket>();

const getBucket = (key: string): Bucket => {
  const existing = buckets.get(key);
  if (existing) return existing;
  const created: Bucket = { count: 0, resetAt: 0, failures: 0, lockedUntil: 0 };
  buckets.set(key, created);
  return created;
};

/** Prune occasionally to avoid unbounded growth */
let pruneCounter = 0;
const maybePrune = () => {
  pruneCounter += 1;
  if (pruneCounter < 200) return;
  pruneCounter = 0;
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now && bucket.lockedUntil < now && bucket.count === 0) {
      buckets.delete(key);
    }
  }
};

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number; reason: "rate_limit" | "locked" };

/**
 * Sliding window counter. Returns ok:false when over limit.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  maybePrune();
  const now = Date.now();
  const bucket = getBucket(key);

  if (bucket.lockedUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.lockedUntil - now) / 1000), reason: "locked" };
  }

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
      reason: "rate_limit",
    };
  }
  return { ok: true };
}

/** Record a failed attempt; lock after maxFailures. */
export function recordFailure(
  key: string,
  maxFailures: number,
  lockoutMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = getBucket(key);
  if (bucket.lockedUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.lockedUntil - now) / 1000), reason: "locked" };
  }
  bucket.failures += 1;
  if (bucket.failures >= maxFailures) {
    bucket.lockedUntil = now + lockoutMs;
    bucket.failures = 0;
    return { ok: false, retryAfterSec: Math.ceil(lockoutMs / 1000), reason: "locked" };
  }
  return { ok: true };
}

export function clearFailures(key: string): void {
  const bucket = buckets.get(key);
  if (!bucket) return;
  bucket.failures = 0;
  bucket.lockedUntil = 0;
}

export function getLockStatus(key: string): RateLimitResult {
  const bucket = buckets.get(key);
  const now = Date.now();
  if (bucket && bucket.lockedUntil > now) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.lockedUntil - now) / 1000),
      reason: "locked",
    };
  }
  return { ok: true };
}
