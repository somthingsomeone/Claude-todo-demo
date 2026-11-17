import { connection } from "next/server";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";
import { displayName, doctorPath, specialtyPath } from "@/lib/doctors";
import { absoluteUrl, isSiteLive, SITE_DESCRIPTION, SITE_NAME, SITE_NAME_EN } from "@/lib/site";
import { SPECIALTY_ORDER, SPECIALTY_PAGES } from "@/lib/specialty-content";

/**
 * /llms.txt — a plain summary of the site for AI assistants (llmstxt.org): what PANIVO is,
 * the specialty pages and every published doctor, each with its link. Demo profiles never appear.
 */
export async function GET() {
  await connection();
  const live = isSiteLive();
  const doctors = (await listPublicDoctors(await getDb())).filter((d) => !d.demo);

  const lines = [
    `# ${SITE_NAME_EN} (${SITE_NAME})`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "دليل عربي لأطباء وأخصائيي العلاج الطبيعي في الرياض. يُدرج كل طبيب بموافقته، ولكل معلومة مصدرها وتاريخ آخر تحقق منها. التواصل مع العيادة مباشرة عبر واتساب؛ لا حجز ولا دفع في الموقع، ولا تقييمات، ولا ظهور مدفوع.",
    "",
    "## التخصصات في الرياض",
    "",
    ...SPECIALTY_ORDER.map((s) => `- [${SPECIALTY_PAGES[s].title}](${absoluteUrl(specialtyPath(s))}): ${SPECIALTY_PAGES[s].description}`),
    "",
    "## الأطباء",
    "",
    ...(doctors.length
      ? doctors.map((d) => `- [${displayName(d)}](${absoluteUrl(doctorPath(d))}): ${d.role}، ${d.hospital}، ${d.district}`)
      : ["- لا توجد ملفات منشورة بعد."]),
    "",
    "## عن الموقع",
    "",
    `- [ما هو بانيفو؟](${absoluteUrl("/intro")})`,
    `- [من نحن وكيف نتحقق](${absoluteUrl("/about")})`,
    `- [سياسة الخصوصية](${absoluteUrl("/privacy")})`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Until launch (SITE_LIVE=true) this file stays out of search engines like every page.
      ...(live ? {} : { "X-Robots-Tag": "noindex, nofollow" }),
    },
  });
}
