import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DoctorSlip } from "@/components/DoctorSlip";
import { ArrowIcon, BuildingIcon, ChevronIcon, MapIcon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { getDb } from "@/lib/db/client";
import { getPublicClinic, listPublicDoctors } from "@/lib/data/doctors";
import { clinicPath, specialtyName } from "@/lib/doctors";
import { clinicBreadcrumb, clinicJsonLd, pageMetadata } from "@/lib/seo";

async function load(props: PageProps<"/riyadh/clinics/[clinic]">) {
  await connection();
  const slug = (await props.params).clinic;
  const db = await getDb();
  const clinic = await getPublicClinic(db, slug);
  const doctors = clinic ? await listPublicDoctors(db, { clinicSlug: slug }) : [];
  return { clinic, doctors };
}

export async function generateMetadata(props: PageProps<"/riyadh/clinics/[clinic]">): Promise<Metadata> {
  const { clinic } = await load(props);
  if (!clinic) return { title: "الصفحة غير موجودة", robots: { index: false, follow: false } };
  const specs = clinic.specialties.map(specialtyName).join("، ");
  return pageMetadata({
    title: `${clinic.name} في ${clinic.district}`,
    description: `${clinic.name} في ${clinic.district}: ${specs}. الأطباء المدرجون في بانيفو وطريقة التواصل المباشر مع العيادة.`,
    path: clinicPath(clinic.slug),
    noindex: clinic.demo,
  });
}

export default async function ClinicPage(props: PageProps<"/riyadh/clinics/[clinic]">) {
  const { clinic, doctors } = await load(props);
  if (!clinic) notFound();

  return (
    <article className="wrap detail">
      <JsonLd data={[clinicJsonLd(clinic, doctors), clinicBreadcrumb(clinic)]} />
      <div className="detail-bar">
        <Link href="/" className="round-btn" aria-label="رجوع إلى الرئيسية">
          <ArrowIcon size={22} />
        </Link>
      </div>
      <nav className="crumbs" aria-label="مسار الصفحة">
        <Link href="/">الرئيسية</Link>
        <ChevronIcon size={14} />
        <span aria-current="page">{clinic.name}</span>
      </nav>

      <div className="page">
        <header className="profile-slip">
          {clinic.demo && <span className="label label--demo">عيادة تجريبية</span>}
          <h1 className="profile-slip__name">{clinic.name}</h1>
          <p className="slip__where">
            <BuildingIcon size={16} />
            {clinic.district}
          </p>
          <ul className="clinic-slip__specs">
            {clinic.specialties.map((s) => (
              <li key={s} className="label">
                {specialtyName(s)}
              </li>
            ))}
          </ul>
          {clinic.mapUrl && !clinic.demo && (
            <p className="profile-slip__seal">
              <a href={clinic.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn--quiet">
                <MapIcon size={18} />
                الموقع على الخريطة
              </a>
            </p>
          )}
        </header>

        <section aria-labelledby="clinic-doctors">
          <h2 id="clinic-doctors" className="section-title">
            الأطباء في هذه العيادة
          </h2>
          <div className="stack">
            {doctors.map((d) => (
              <DoctorSlip key={d.slug} doctor={d} />
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
