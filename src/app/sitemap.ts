import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";
import { doctorPath, specialtyPath } from "@/lib/doctors";
import { absoluteUrl, isSiteLive } from "@/lib/site";
import { SPECIALTY_ORDER } from "@/lib/specialty-content";

/** Built automatically from the database. Empty until launch (SITE_LIVE=true); demo profiles never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteLive()) return [];
  await connection();
  const db = await getDb();
  const doctors = await listPublicDoctors(db);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...SPECIALTY_ORDER.map((s) => ({ url: absoluteUrl(specialtyPath(s)), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...doctors.filter((d) => !d.demo).map((d) => ({ url: absoluteUrl(doctorPath(d)), lastModified: d.updatedAt, priority: 0.7 })),
    { url: absoluteUrl("/intro"), priority: 0.5 },
    { url: absoluteUrl("/about"), priority: 0.5 },
    { url: absoluteUrl("/terms"), priority: 0.2 },
    { url: absoluteUrl("/privacy"), priority: 0.2 },
  ];
}
