import type { Metadata } from "next";
import { connection } from "next/server";
import { FavoritesView } from "@/components/FavoritesView";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "المفضلة",
  description: "الأطباء اللي حفظتهم في باناكس على هذا الجهاز.",
  path: "/favorites",
  noindex: true,
});

export default async function FavoritesPage() {
  await connection();
  const doctors = await listPublicDoctors(await getDb());
  return <FavoritesView doctors={doctors} />;
}
