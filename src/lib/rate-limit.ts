import { createHmac, randomBytes } from "node:crypto";
import type { Db } from "./db/client";

/**
 * Simple fixed-window rate limiting stored in the database, so it works across
 * serverless instances. The visitor's IP is never stored: only a keyed hash of it,
 * and rows are deleted after a day.
 */

// Without RATE_LIMIT_SECRET a random per-process secret is used (still never reversible).
const fallbackSecret = randomBytes(32).toString("hex");

export function hashKey(ip: string, secret = process.env.RATE_LIMIT_SECRET || fallbackSecret) {
  return createHmac("sha256", secret).update(ip).digest("base64url").slice(0, 32);
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for / x-real-ip). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

export const LIMITS = {
  correction: { limit: 5, windowSec: 60 * 60 }, // 5 requests per hour
  click: { limit: 3, windowSec: 60 * 60 }, // 3 counted clicks per profile per hour
  login: { limit: 5, windowSec: 60 * 60 }, // 5 login emails per hour
} as const;

/** Returns true when allowed (and counts the hit), false when over the limit. */
export async function rateLimit(
  db: Db,
  bucket: string,
  ip: string,
  { limit, windowSec }: { limit: number; windowSec: number },
): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / (windowSec * 1000)) * windowSec * 1000).toISOString();
  const [row] = await db.query<{ hits: number }>(
    `insert into rate_limits (bucket, key, window_start, hits) values ($1, $2, $3, 1)
     on conflict (bucket, key, window_start) do update set hits = rate_limits.hits + 1
     returning hits`,
    [bucket, hashKey(ip), windowStart],
  );
  // Occasional cleanup of old windows.
  if (Math.random() < 0.05) await db.query(`delete from rate_limits where window_start < now() - interval '1 day'`);
  return row.hits <= limit;
}
