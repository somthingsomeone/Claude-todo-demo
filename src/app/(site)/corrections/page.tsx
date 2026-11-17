import type { Metadata } from "next";
import { connection } from "next/server";
import { ContactEmail } from "@/components/ContactEmail";
import { InfoPage } from "@/components/InfoPage";
import { getDb } from "@/lib/db/client";
import { getPublicDoctor } from "@/lib/data/doctors";
import { displayName } from "@/lib/doctors";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "طلب تصحيح أو إزالة",
  description: "اطلب تصحيح معلومة أو إزالة ملف من دليل بانيفو عبر البريد الإلكتروني.",
  path: "/corrections",
  noindex: true,
});

/** Corrections and removals go by email; the site keeps no form and stores nothing here. */
export default async function CorrectionsPage(props: PageProps<"/corrections">) {
  await connection();
  const { profile } = await props.searchParams;
  const doctor = typeof profile === "string" ? await getPublicDoctor(await getDb(), profile) : null;
  const name = doctor ? displayName(doctor) : null;
  const subject = name ? `طلب تصحيح: ${name}` : "طلب تصحيح أو إزالة";
  const body = [
    name ? `الملف: ${name}` : "الملف المقصود: ",
    "المعلومة غير الدقيقة أو المطلوب: ",
    "صلتي بالملف (الطبيب نفسه، أو ممثل عنه، أو مراجع): ",
  ].join("\n");

  return (
    <InfoPage title="طلب تصحيح أو إزالة">
      <p className="page__lede">
        إن وجدت معلومة غير دقيقة، أو كنت طبيبًا وتريد تعديل ملفك أو إزالته، فراسلنا بالبريد الإلكتروني:
      </p>
      <p>
        <ContactEmail subject={subject} body={body} />
      </p>
      <h2>اذكر في رسالتك</h2>
      <ul>
        <li>اسم الطبيب أو رابط ملفه{name ? ` (${name})` : ""}.</li>
        <li>المعلومة غير الدقيقة وتصحيحها، أو طلب الإزالة.</li>
        <li>صلتك بالملف: الطبيب نفسه، أو ممثل عنه، أو مراجع.</li>
      </ul>
      <p>
        نراجع كل رسالة ونحدّث الملف أو نخفيه، ونرد عليك خلال 30 يومًا كحد أقصى. لا نستخدم بريدك إلا للرد على طلبك.
      </p>
    </InfoPage>
  );
}
