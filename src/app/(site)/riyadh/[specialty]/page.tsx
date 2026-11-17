import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ClinicSlip } from "@/components/ClinicSlip";
import { DoctorSlip } from "@/components/DoctorSlip";
import { ChevronIcon, PlusIcon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { SearchBand } from "@/components/SearchBand";
import { Shelf } from "@/components/Shelf";
import { getDb } from "@/lib/db/client";
import { listPublicClinics, listPublicDoctors } from "@/lib/data/doctors";
import { isSpecialty, specialtyPath } from "@/lib/doctors";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { SPECIALTY_ORDER, SPECIALTY_PAGES } from "@/lib/specialty-content";

export function generateStaticParams() {
  return SPECIALTY_ORDER.map((specialty) => ({ specialty }));
}

export async function generateMetadata(props: PageProps<"/riyadh/[specialty]">): Promise<Metadata> {
  const { specialty } = await props.params;
  if (!isSpecialty(specialty)) return { title: "الصفحة غير موجودة", robots: { index: false, follow: false } };
  const page = SPECIALTY_PAGES[specialty];
  return pageMetadata({ title: page.title, description: page.description, path: specialtyPath(specialty) });
}

export default async function SpecialtyLanding(props: PageProps<"/riyadh/[specialty]">) {
  const { specialty } = await props.params;
  if (!isSpecialty(specialty)) notFound();
  const page = SPECIALTY_PAGES[specialty];
  await connection();
  const db = await getDb();
  const [doctors, clinics] = await Promise.all([
    listPublicDoctors(db, { specialty }),
    listPublicClinics(db).then((all) => all.filter((c) => c.specialties.includes(specialty))),
  ]);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "الرئيسية", path: "/" },
            { name: page.title, path: specialtyPath(specialty) },
          ]),
          faqJsonLd(page.faqs),
        ]}
      />
      <SearchBand title={page.title} tiles={false} />

      <div className="wrap page">
        <nav className="crumbs" aria-label="مسار الصفحة">
          <Link href="/">الرئيسية</Link>
          <ChevronIcon size={14} />
          <span aria-current="page">{page.title}</span>
        </nav>

        <p className="page__lede">{page.intro}</p>

        <section aria-labelledby="list-title">
          <h2 id="list-title" className="section-title">
            {doctors.length > 0 ? `${doctors.length} ${doctors.length === 1 ? "ملف" : "ملفات"} في هذا التخصص` : "الأطباء"}
          </h2>
          {doctors.length > 0 ? (
            <div className="stack">
              {doctors.map((d) => (
                <DoctorSlip key={d.slug} doctor={d} showSpecialty={false} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <p className="empty__title">لا توجد ملفات منشورة في هذا التخصص بعد</p>
              <p className="muted">نضيف الأطباء بعد موافقتهم والتحقق من معلوماتهم.</p>
              <Link href="/" className="btn btn--quiet">
                تصفّح التخصصات الأخرى
              </Link>
            </div>
          )}
        </section>

        {clinics.length > 0 && (
          <Shelf id="clinics-title" title="عيادات تقدّم هذا التخصص">
            {clinics.map((c) => (
              <ClinicSlip key={c.slug} clinic={c} />
            ))}
          </Shelf>
        )}

        <section aria-labelledby="faq-title">
          <h2 id="faq-title" className="section-title">
            أسئلة شائعة
          </h2>
          <div className="faq">
            {page.faqs.map((f) => (
              <details key={f.q}>
                <summary>
                  {f.q}
                  <PlusIcon size={20} className="icon" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <p className="updated fact__src--spaced">
            معلومات عامة وليست استشارة طبية. للتشخيص والعلاج راجع طبيبك، وفي الحالات الطارئة اتصل بالرقم 997 أو 911.
          </p>
        </section>
      </div>
    </>
  );
}
