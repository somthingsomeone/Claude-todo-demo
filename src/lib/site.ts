/**
 * Site-wide settings read from environment variables.
 *
 * SITE_LIVE (default false):
 *   false → hidden from search engines (noindex), «تجريبي» badge shown, demo profiles shown.
 *   true  → indexable, no badge, demo profiles hidden everywhere.
 * NEXT_PUBLIC_SITE_URL: the public address (change it after buying a domain, then redeploy).
 */

export const SITE_NAME = "باناكس";
export const SITE_NAME_EN = "Panax";
export const SITE_TAGLINE = "اعرف طبيبك قبل موعدك";
export const SITE_DESCRIPTION =
  "باناكس دليل لأطباء وأخصائيين في الرياض: جلدية، تجميل وليزر، عيون، أسنان، وعلاج طبيعي. معلومات واضحة بمصادرها وتواصل مباشر مع العيادة عبر واتساب.";

export function isSiteLive(env: Record<string, string | undefined> = process.env): boolean {
  return env.SITE_LIVE?.trim().toLowerCase() === "true";
}

export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const raw =
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Absolute URL for a path on this site. */
export function absoluteUrl(path = "/"): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
