import type { Metadata } from "next";
import { connection } from "next/server";
import { FavoritesView } from "@/components/FavoritesView";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";

export const metadata: Metadata = { title: "المفضلة" };

export default async function FavoritesPage() {
  await connection();
  const doctors = await listPublicDoctors(await getDb());
  return <FavoritesView doctors={doctors} />;
}
