import { connection } from "next/server";
import { HomeView } from "@/components/HomeView";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";

export default async function HomePage() {
  await connection();
  const doctors = await listPublicDoctors(await getDb());
  return <HomeView doctors={doctors} />;
}
