import type { MetadataRoute } from "next";
import { absoluteUrl, isSiteLive } from "@/lib/site";

/**
 * Prepared for launch: search engines and AI assistants are named and allowed, but
 * nothing may crawl until SITE_LIVE=true (the same switch that removes noindex).
 */
export const CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "Google-Extended",
  "PerplexityBot",
] as const;

const PRIVATE_PATHS = ["/admin", "/api/", "/favorites", "/settings", "/corrections", "/search"];

export default function robots(): MetadataRoute.Robots {
  if (!isSiteLive()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      ...CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE_PATHS })),
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
