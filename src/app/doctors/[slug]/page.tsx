import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import {
  ArrowIcon,
  BriefcaseIcon,
  CheckIcon,
  GlobeIcon,
  HospitalIcon,
  PinIcon,
  SpecialtyIcon,
  WhatsAppIcon,
} from "@/components/Icons";
import { Stars } from "@/components/Stars";
import { DOCTORS, displayName, getDoctor, specialtyName, whatsappLink } from "@/lib/doctors";

export function generateStaticParams() {
  return DOCTORS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata(props: PageProps<"/doctors/[slug]">): Promise<Metadata> {
  const doctor = getDoctor((await props.params).slug);
  return doctor ? { title: displayName(doctor), description: doctor.bio } : {};
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "long" }).format(new Date(iso));
}

export default async function DoctorPage(props: PageProps<"/doctors/[slug]">) {
  const doctor = getDoctor((await props.params).slug);
  if (!doctor) notFound();

  const wa = whatsappLink(doctor);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${doctor.hospital} ${doctor.district}`,
  )}`;

  return (
    <article className="profile">
      <div className="profile__nav">
        <Link href={`/?specialty=${doctor.specialty}`} className="icon-btn" aria-label="رجوع">
          <ArrowIcon size={22} />
        </Link>
        <FavoriteButton slug={doctor.slug} name={displayName(doctor)} className="icon-btn" />
      </div>

      <header className={`profile__hero tint-${doctor.specialty}`}>
        <Avatar doctor={doctor} className="profile__photo" />
        <div className="profile__id">
          <div className="profile__pills">
            <span className="pill pill--glass">
              <SpecialtyIcon slug={doctor.specialty} size={15} />
              {specialtyName(doctor.specialty)}
            </span>
            {doctor.demo && <span className="pill pill--demo">ملف تجريبي</span>}
          </div>
          <h1 className="profile__name">{displayName(doctor)}</h1>
          <p className="profile__role">{doctor.role}</p>
          <p className="profile__place">
            <HospitalIcon size={18} />
            {doctor.hospital}
          </p>
        </div>
      </header>

      <section className="glass card rating-card" aria-label="التقييم">
        <div className="rating-card__score">
          <strong>{doctor.rating.toFixed(1)}</strong>
          <span>/ 5</span>
        </div>
        <div>
          <Stars rating={doctor.rating} size={22} />
          <p className="muted">من {doctor.ratingCount} تقييم</p>
        </div>
      </section>

      <div className="contact-bar">
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            <WhatsAppIcon size={22} />
            تواصل عبر واتساب
          </a>
        ) : (
          <span className="btn-whatsapp is-disabled" aria-disabled="true">
            <WhatsAppIcon size={22} />
            واتساب (غير متاح في الملف التجريبي)
          </span>
        )}
      </div>

      <section className="glass card">
        <h2 className="card__title">نبذة</h2>
        <p>{doctor.bio}</p>
      </section>

      <section className="glass card">
        <h2 className="card__title">{doctor.specialty === "physio" ? "يساعد في" : "يعالج"}</h2>
        <ul className="treats">
          {doctor.treats.map((t) => (
            <li key={t}>
              <CheckIcon size={16} />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass card">
        <h2 className="card__title">معلومات</h2>
        <ul className="facts">
          <li>
            <span className="facts__icon">
              <SpecialtyIcon slug={doctor.specialty} size={18} />
            </span>
            <span>
              <small>التخصص</small>
              {doctor.role}
            </span>
          </li>
          <li>
            <span className="facts__icon">
              <BriefcaseIcon size={18} />
            </span>
            <span>
              <small>الخبرة</small>
              {doctor.yearsExperience} سنة
            </span>
          </li>
          <li>
            <span className="facts__icon">
              <GlobeIcon size={18} />
            </span>
            <span>
              <small>اللغات</small>
              {doctor.languages.join("، ")}
            </span>
          </li>
          <li>
            <span className="facts__icon">
              <PinIcon size={18} />
            </span>
            <span>
              <small>الموقع</small>
              {doctor.hospital} — {doctor.district}
              {!doctor.demo && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="facts__link">
                  افتح في الخريطة
                </a>
              )}
            </span>
          </li>
        </ul>
        <p className="source-note">
          المصدر: {doctor.source} · آخر تحقق: {formatDate(doctor.checkedAt)}
        </p>
      </section>

    </article>
  );
}
