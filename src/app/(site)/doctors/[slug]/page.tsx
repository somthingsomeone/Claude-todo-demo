import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/lib/db/client";
import { getPublicDoctor } from "@/lib/data/doctors";
import { doctorPath } from "@/lib/doctors";

/** Old address (/doctors/<slug>) → the descriptive one (/riyadh/<specialty>/<slug>). */
export default async function OldDoctorUrl(props: PageProps<"/doctors/[slug]">) {
  await connection();
  const d = await getPublicDoctor(await getDb(), (await props.params).slug);
  if (!d) notFound();
  permanentRedirect(doctorPath(d));
}
