import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { FavoriteButton } from "@/components/FavoriteButton";
import {
  ArrowIcon,
  BriefcaseIcon,
  BuildingIcon,
  ChevronIcon,
  EditIcon,
  GlobeIcon,
  PinIcon,
  SpecialtyIcon,
} from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { ShareButton } from "@/components/ShareButton";
import { Stamp, stampDate } from "@/components/Stamp";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getDb } from "@/lib/db/client";
import { getPublicDoctor } from "@/lib/data/doctors";
import { clinicPath, displayName, doctorPath, specialtyName, specialtyPath, whatsappLink } from "@/lib/doctors";
import { doctorBreadcrumb, doctorDescription, doctorJsonLd, pageMetadata } from "@/lib/seo";
import { SPECIALTY_PAGES } from "@/lib/specialty-content";

async function load(props: PageProps<"/riyadh/[specialty]/[doctor]">) {
  await connection();
  const { specialty, doctor } = await props.params;
  const d = await getPublicDoctor(await getDb(), doctor);
  return { d, specialty };
}

export async function generateMetadata(props: PageProps<"/riyadh/[specialty]/[doctor]">): Promise<Metadata> {
  const { d } = await load(props);
  if (!d) return { title: "الصفحة غير موجودة", robots: { index: false, follow: false } };
  return pageMetadata({
    title: `${displayName(d)}، ${d.role} في الرياض`,
    description: doctorDescription(d),
    path: doctorPath(d),
    noindex: d.demo, // demo profiles never go to search engines
  });
}

export default async function DoctorPage(props: PageProps<"/riyadh/[specialty]/[doctor]">) {
  const { d, specialty } = await load(props);
  if (!d) notFound();
  if (d.specialty !== specialty) permanentRedirect(doctorPath(d));

  const wa = whatsappLink(d);
  const mapUrl = d.mapUrl;
  const src = `${d.source} · تحقق ${stampDate(d.checkedAt)}`;
  const page = SPECIALTY_PAGES[d.specialty];

  return (
    <article className="wrap detail">
      <JsonLd data={[doctorJsonLd(d), doctorBreadcrumb(d)]} />

      <div className="detail-bar">
        <Link href={specialtyPath(d.specialty)} className="round-btn" aria-label={`رجوع إلى ${page.title}`}>
          <ArrowIcon size={22} />
        </Link>
        <div className="detail-bar__end">
          <ShareButton title={displayName(d)} />
          <FavoriteButton slug={d.slug} name={displayName(d)} className="round-btn" />
        </div>
      </div>

      <nav className="crumbs" aria-label="مسار الصفحة">
        <Link href="/">الرئيسية</Link>
        <ChevronIcon size={14} />
        <Link href={specialtyPath(d.specialty)}>{page.title}</Link>
        <ChevronIcon size={14} />
        <span aria-current="page">{displayName(d)}</span>
      </nav>

      <div className="page">
        <header className="profile-slip">
          <div className="profile-slip__top">
            <div>
              <h1 className="profile-slip__name">{displayName(d)}</h1>
              <p className="profile-slip__role">{d.role}</p>
              <p className="profile-slip__tags">
                <Link href={specialtyPath(d.specialty)} className="label">
                  <SpecialtyIcon slug={d.specialty} size={14} />
                  {specialtyName(d.specialty)}
                </Link>
                {d.demo && <span className="label label--demo">ملف تجريبي</span>}
              </p>
            </div>
            {d.photo ? <img className="profile-slip__photo" src={d.photo} alt={`صورة ${d.name}`} /> : null}
          </div>
          <div className="profile-slip__seal">
            <Stamp checkedAt={d.checkedAt} large />
            <p>
              <b>ملف موثّق.</b> أُدرج الطبيب بموافقته، وتحققنا من معلوماته في {stampDate(d.checkedAt)}.
              <br />
              المصدر: {d.source}
            </p>
          </div>
        </header>

        <section aria-labelledby="facts-title">
          <h2 id="facts-title" className="section-title">
            المعلومات
          </h2>
          <ul className="group">
            <li className="fact">
              <span className="row__icon">
                <BuildingIcon size={18} />
              </span>
              <span className="fact__label">العيادة</span>
              <span className="fact__value">
                {d.clinicSlug ? (
                  <Link href={clinicPath(d.clinicSlug)} className="link">
                    {d.hospital}
                  </Link>
                ) : (
                  d.hospital
                )}
              </span>
              <span className="fact__src">{src}</span>
            </li>
            <li className="fact">
              <span className="row__icon">
                <PinIcon size={18} />
              </span>
              <span className="fact__label">الحي</span>
              <span className="fact__value">
                {d.district}
                {mapUrl && !d.demo && (
                  <>
                    {" · "}
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="link">
                      الخريطة
                    </a>
                  </>
                )}
              </span>
              <span className="fact__src">{src}</span>
            </li>
            {d.yearsExperience !== null && (
              <li className="fact">
                <span className="row__icon">
                  <BriefcaseIcon size={18} />
                </span>
                <span className="fact__label">الخبرة</span>
                <span className="fact__value">{d.yearsExperience} سنة</span>
                <span className="fact__src">{src}</span>
              </li>
            )}
            {d.languages.length > 0 && (
              <li className="fact">
                <span className="row__icon">
                  <GlobeIcon size={18} />
                </span>
                <span className="fact__label">اللغات</span>
                <span className="fact__value">{d.languages.join("، ")}</span>
                <span className="fact__src">{src}</span>
              </li>
            )}
          </ul>
        </section>

        {d.bio && (
          <section aria-labelledby="bio-title">
            <h2 id="bio-title" className="section-title">
              نبذة
            </h2>
            <div className="group group--pad">
              <p>{d.bio}</p>
              <p className="fact__src">{src}</p>
            </div>
          </section>
        )}

        {d.treats.length > 0 && (
          <section aria-labelledby="treats-title">
            <h2 id="treats-title" className="section-title">
              {d.specialty === "physio" ? "يساعد في" : "يعالج"}
            </h2>
            <div className="group group--pad">
              <ul className="chips">
                {d.treats.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="fact__src fact__src--spaced">
                {src}
              </p>
            </div>
          </section>
        )}

        <ul className="group">
          <li>
            <Link href={`/corrections?profile=${d.slug}`} className="row row--link">
              <span className="row__icon">
                <EditIcon size={18} />
              </span>
              <span className="row__text">
                طلب تصحيح أو إزالة
                <small>إن وجدت معلومة غير دقيقة في هذا الملف</small>
              </span>
              <ChevronIcon size={18} className="row__chev" />
            </Link>
          </li>
        </ul>
      </div>

      <div className="contact-bar">
        <WhatsAppButton
          slug={d.slug}
          href={wa}
          label={wa ? `تواصل مع العيادة عبر واتساب` : d.demo ? "التواصل غير متاح في الملف التجريبي" : "رقم التواصل غير متوفر"}
          className="contact-bar__btn"
        />
      </div>
    </article>
  );
}
