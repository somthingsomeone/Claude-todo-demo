import type { MetadataRoute } from "next";
import { absoluteUrl, isSiteLive } from "@/lib/site";

/** Search engines and AI assistants may crawl only after launch (SITE_LIVE=true). */
export default function robots(): MetadataRoute.Robots {
  if (!isSiteLive()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  const privatePaths = ["/admin", "/api/", "/favorites", "/settings", "/corrections"];
  const allowed = ["Googlebot", "Bingbot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot"];
  return {
    rules: [
      ...allowed.map((userAgent) => ({ userAgent, allow: "/", disallow: privatePaths })),
      { userAgent: "*", allow: "/", disallow: privatePaths },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
