import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";
import { absoluteUrl, isSiteLive } from "@/lib/site";
import { SPECIALTY_ORDER } from "@/lib/specialty-content";

/** Empty until launch (SITE_LIVE=true). Demo profiles are never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteLive()) return [];
  await connection();
  const doctors = (await listPublicDoctors(await getDb())).filter((d) => !d.demo);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...SPECIALTY_ORDER.map((s) => ({ url: absoluteUrl(`/riyadh/${s}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...doctors.map((d) => ({ url: absoluteUrl(`/doctors/${d.slug}`), lastModified: d.updatedAt, priority: 0.7 })),
    { url: absoluteUrl("/about"), priority: 0.5 },
    { url: absoluteUrl("/terms"), priority: 0.2 },
    { url: absoluteUrl("/privacy"), priority: 0.2 },
  ];
}
