import type { Metadata } from "next";
import { connection } from "next/server";
import { HomeView } from "@/components/HomeView";
import { JsonLd } from "@/components/JsonLd";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";
import { organizationJsonLd, pageMetadata } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: `${SITE_NAME} — ${SITE_TAGLINE} | أطباء الرياض`,
  absoluteTitle: true,
  description: SITE_DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  await connection();
  const doctors = await listPublicDoctors(await getDb());
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <HomeView doctors={doctors} />
    </>
  );
}
