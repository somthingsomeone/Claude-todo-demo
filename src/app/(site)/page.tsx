import type { Metadata } from "next";
import { connection } from "next/server";
import { ClinicSlip } from "@/components/ClinicSlip";
import { DoctorSlip } from "@/components/DoctorSlip";
import { JsonLd } from "@/components/JsonLd";
import { SearchBand } from "@/components/SearchBand";
import { Shelf } from "@/components/Shelf";
import { getDb } from "@/lib/db/client";
import { listPublicClinics, listPublicDoctors } from "@/lib/data/doctors";
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

export default async function HomePage() {
  await connection();
  const db = await getDb();
  const [doctors, clinics] = await Promise.all([listPublicDoctors(db), listPublicClinics(db)]);

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
          <>
            <Shelf id="shelf-doctors" title="أطباء في الرياض">
              {doctors.slice(0, 10).map((d) => (
                <DoctorSlip key={d.slug} doctor={d} />
              ))}
            </Shelf>

            {clinics.length > 0 && (
              <Shelf id="shelf-clinics" title="العيادات">
                {clinics.map((c) => (
                  <ClinicSlip key={c.slug} clinic={c} />
                ))}
              </Shelf>
            )}

            {SPECIALTY_ORDER.map((s) => {
              const list = doctors.filter((d) => d.specialty === s);
              if (list.length === 0) return null;
              return (
                <Shelf
                  key={s}
                  id={`shelf-${s}`}
                  title={SPECIALTY_PAGES[s].shelf}
                  more={{ href: specialtyPath(s), label: `عرض الكل (${list.length})` }}
                >
                  {list.map((d) => (
                    <DoctorSlip key={d.slug} doctor={d} showSpecialty={false} />
                  ))}
                </Shelf>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
