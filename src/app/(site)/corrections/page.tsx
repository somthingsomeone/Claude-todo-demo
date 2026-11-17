import type { Metadata } from "next";
import { connection } from "next/server";
import { InfoPage } from "@/components/InfoPage";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";
import { displayName } from "@/lib/doctors";
import { pageMetadata } from "@/lib/seo";
import { CorrectionForm } from "./CorrectionForm";

export const metadata: Metadata = pageMetadata({
  title: "طلب تصحيح أو إزالة",
  description: "اطلب تصحيح معلومة أو إزالة ملف من دليل بانيفو.",
  path: "/corrections",
  noindex: true,
});

export default async function CorrectionsPage(props: PageProps<"/corrections">) {
  await connection();
  const { profile } = await props.searchParams;
  const doctors = await listPublicDoctors(await getDb());
  const profiles = doctors.map((d) => ({ slug: d.slug, label: `${displayName(d)} — ${d.hospital}` }));
  const initial = typeof profile === "string" && profiles.some((p) => p.slug === profile) ? profile : "";
  return (
    <InfoPage title="طلب تصحيح أو إزالة" bare>
      <p className="page__lede">
        إذا كنت طبيبًا أو تمثّل منشأة، أو لاحظت معلومة غير دقيقة، فأرسل إلينا طلبك. نحفظ فقط: اسمك، وبريدك، وصلتك بالملف، والملف المقصود، ورسالتك.
      </p>
      <CorrectionForm profiles={profiles} initialProfile={initial} />
    </InfoPage>
  );
}
