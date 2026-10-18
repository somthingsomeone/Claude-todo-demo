import type { Metadata } from "next";
import { connection } from "next/server";
import { InfoPage } from "@/components/InfoPage";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";
import { displayName } from "@/lib/doctors";
import { CorrectionForm } from "./CorrectionForm";

export const metadata: Metadata = { title: "طلب تصحيح أو إزالة" };

export default async function CorrectionsPage(props: PageProps<"/corrections">) {
  await connection();
  const { profile } = await props.searchParams;
  const doctors = await listPublicDoctors(await getDb());
  const profiles = doctors.map((d) => ({ slug: d.slug, label: `${displayName(d)} — ${d.hospital}` }));
  const initial = typeof profile === "string" && profiles.some((p) => p.slug === profile) ? profile : "";
  return (
    <InfoPage title="طلب تصحيح أو إزالة" bare>
      <p className="muted">
        إذا كنت طبيبًا أو تمثّل منشأة أو لاحظت معلومة غلط، أرسل لنا طلبك. نحفظ فقط: اسمك، بريدك، صلتك بالملف، الملف، ورسالتك.
      </p>
      <CorrectionForm profiles={profiles} initialProfile={initial} />
    </InfoPage>
  );
}
