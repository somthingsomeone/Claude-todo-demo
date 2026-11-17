import type { Metadata } from "next";
import { connection } from "next/server";
import { DoctorSlip } from "@/components/DoctorSlip";
import { JsonLd } from "@/components/JsonLd";
import { SearchBand } from "@/components/SearchBand";
import { Shelf } from "@/components/Shelf";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";
import { specialtyPath } from "@/lib/doctors";
import { organizationJsonLd, pageMetadata } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { SPECIALTY_ORDER, SPECIALTY_PAGES } from "@/lib/specialty-content";

export const metadata: Metadata = pageMetadata({
  title: `${SITE_NAME} | أطباء وأخصائيون سعوديون في الرياض`,
  absoluteTitle: true,
  description: SITE_DESCRIPTION,
  path: "/",
});

/** Home is the app: the search band, then one swipeable shelf per specialty. */
export default async function HomePage() {
  await connection();
  const doctors = await listPublicDoctors(await getDb());

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <SearchBand title="ابحث عن طبيبك في الرياض" />

      <div className="wrap">
        {doctors.length === 0 ? (
          <div className="empty empty--spaced">
            <p className="empty__title">لا توجد ملفات منشورة بعد</p>
            <p className="muted">نضيف الأطباء بعد موافقتهم والتحقق من معلوماتهم.</p>
          </div>
        ) : (
          SPECIALTY_ORDER.map((s) => {
            const list = doctors.filter((d) => d.specialty === s);
            if (list.length === 0) return null;
            return (
              <Shelf
                key={s}
                id={`shelf-${s}`}
                title={SPECIALTY_PAGES[s].shelf}
                more={{ href: specialtyPath(s), label: `عرض الكل (${list.length})` }}
              >
                {list.slice(0, 10).map((d) => (
                  <DoctorSlip key={d.slug} doctor={d} />
                ))}
              </Shelf>
            );
          })
        )}
      </div>
    </>
  );
}
