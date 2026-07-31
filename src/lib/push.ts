/* Web Push plumbing — VAPID config + the PushSubscription table.
   Rows are keyed to the anonymous `vaamki-visitor-id` from feedAffinity.ts; no login involved. */

import webpush from "web-push";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export type StoredSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type AffinitySnapshot = Record<string, number>;

let ensureTablePromise: Promise<void> | null = null;

/* Created here as well as in the Prisma schema so an existing deployment picks the table up on
   first access, the same way ensureSiteConfigTable handles SiteConfig. */
export const ensurePushSubscriptionTable = async () => {
  if (!ensureTablePromise) {
    ensureTablePromise = prisma
      .$executeRawUnsafe(
        "CREATE TABLE IF NOT EXISTS `PushSubscription` (" +
          "`id` VARCHAR(191) NOT NULL," +
          "`visitorId` VARCHAR(191) NOT NULL," +
          "`endpointHash` VARCHAR(64) NOT NULL," +
          "`subscription` TEXT NOT NULL," +
          "`affinity` TEXT NOT NULL," +
          "`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)," +
          "`updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)," +
          "UNIQUE INDEX `PushSubscription_endpointHash_key`(`endpointHash`)," +
          "INDEX `PushSubscription_visitorId_idx`(`visitorId`)," +
          "PRIMARY KEY (`id`)" +
          ") DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
      )
      .then(() => undefined)
      .catch((error) => {
        ensureTablePromise = null;
        throw error;
      });
  }
  await ensureTablePromise;
};

export const hashEndpoint = (endpoint: string) =>
  createHash("sha256").update(endpoint).digest("hex");

export const getVapidPublicKey = () => (process.env.VAPID_PUBLIC_KEY || "").trim();

/** Applies the VAPID env vars to web-push. Returns false when the keys aren't configured. */
export const configureWebPush = () => {
  const publicKey = getVapidPublicKey();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const subject = (process.env.VAPID_SUBJECT || "").trim();
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
};

/** Narrow validation — a usable subscription needs an https endpoint and both encryption keys. */
export const parseSubscription = (value: unknown): StoredSubscription | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = typeof raw.endpoint === "string" ? raw.endpoint.trim() : "";
  const p256dh = typeof raw.keys?.p256dh === "string" ? raw.keys.p256dh : "";
  const auth = typeof raw.keys?.auth === "string" ? raw.keys.auth : "";
  if (!endpoint.startsWith("https://") || endpoint.length > 2000 || !p256dh || !auth) return null;
  return { endpoint, keys: { p256dh, auth } };
};

export const parseAffinity = (value: unknown): AffinitySnapshot => {
  if (!value || typeof value !== "object") return {};
  const out: AffinitySnapshot = {};
  for (const [key, score] of Object.entries(value as Record<string, unknown>)) {
    const name = key.trim();
    if (!name || name.length > 191) continue;
    if (typeof score === "number" && Number.isFinite(score) && score > 0) out[name] = score;
  }
  return out;
};
