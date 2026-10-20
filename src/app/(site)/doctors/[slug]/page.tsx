import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Avatar } from "@/components/Avatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import {
  ArrowIcon,
  BriefcaseIcon,
  CheckIcon,
  ChevronIcon,
  EditIcon,
  GlobeIcon,
  HospitalIcon,
  MapIcon,
  PinIcon,
  SpecialtyIcon,
  WhatsAppIcon,
} from "@/components/Icons";
import { ShareButton } from "@/components/ShareButton";
import { Stars } from "@/components/Stars";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getDb } from "@/lib/db/client";
import { getPublicDoctor } from "@/lib/data/doctors";
import { displayName, specialtyName, whatsappLink } from "@/lib/doctors";

async function load(props: PageProps<"/doctors/[slug]">) {
  await connection();
  return getPublicDoctor(await getDb(), (await props.params).slug);
}

export async function generateMetadata(props: PageProps<"/doctors/[slug]">): Promise<Metadata> {
  const doctor = await load(props);
  return doctor ? { title: displayName(doctor), description: doctor.bio } : {};
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "long" }).format(new Date(iso));
}

export default async function DoctorPage(props: PageProps<"/doctors/[slug]">) {
  const doctor = await load(props);
  if (!doctor) notFound();

  const wa = whatsappLink(doctor);
  const mapUrl =
    doctor.mapUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${doctor.hospital} ${doctor.district}`)}`;

  return (
    <article className={`profile tint-${doctor.specialty}`}>
      <div className="profile__nav">
        <Link href={`/?specialty=${doctor.specialty}`} className="icon-btn" aria-label="رجوع">
          <ArrowIcon size={22} />
        </Link>
        <FavoriteButton slug={doctor.slug} name={displayName(doctor)} className="icon-btn" />
      </div>

      <header className="profile__hero">
        <Avatar doctor={doctor} className="profile__photo" round />
        <h1 className="profile__name">{displayName(doctor)}</h1>
        <p className="profile__role">{doctor.role}</p>
        <div className="profile__tags">
          <span className="tag">
            <SpecialtyIcon slug={doctor.specialty} size={14} />
            {specialtyName(doctor.specialty)}
          </span>
          {doctor.demo && <span className="tag tag--demo">ملف تجريبي</span>}
        </div>
      </header>

      <div className="actions">
        {wa ? (
          <WhatsAppButton slug={doctor.slug} href={wa} />
        ) : (
          <span className="action action--whatsapp is-disabled" aria-disabled="true" title="رقم واتساب غير متوفر">
            <span className="action__icon">
              <WhatsAppIcon size={22} />
            </span>
            <span className="action__label">واتساب</span>
          </span>
        )}
        {doctor.demo ? (
          <span className="action is-disabled" aria-disabled="true">
            <span className="action__icon">
              <MapIcon size={22} />
            </span>
            <span className="action__label">الخريطة</span>
          </span>
        ) : (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="action">
            <span className="action__icon">
              <MapIcon size={22} />
            </span>
            <span className="action__label">الخريطة</span>
          </a>
        )}
        <ShareButton title={displayName(doctor)} />
      </div>
      {!wa && <p className="group-footer group-footer--center">{doctor.demo ? "التواصل غير متاح في الملف التجريبي." : "رقم واتساب غير متوفر."}</p>}

      <section className="group rating-row" aria-label="التقييم">
        {doctor.rating === null ? (
          <p className="muted">لا يوجد تقييم بعد.</p>
        ) : (
          <>
            <strong className="rating-row__score">{doctor.rating.toFixed(1)}</strong>
            <div>
              <Stars rating={doctor.rating} size={18} />
              <p className="muted rating-row__count">
                من 5 · {doctor.ratingCount ?? 0} تقييم
                {doctor.ratingSource && ` · ${doctor.ratingSource}`}
              </p>
            </div>
          </>
        )}
      </section>

      {doctor.bio && (
        <section>
          <h2 className="group-header">نبذة</h2>
          <div className="group group--text">
            <p>{doctor.bio}</p>
          </div>
        </section>
      )}

      {doctor.treats.length > 0 && (
        <section>
          <h2 className="group-header">{doctor.specialty === "physio" ? "يساعد في" : "يعالج"}</h2>
          <ul className="group group--text treats">
            {doctor.treats.map((t) => (
              <li key={t}>
                <CheckIcon size={15} />
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="group-header">معلومات</h2>
        <ul className="group list">
          <li className="row">
            <span className="row__icon tile tile--blue">
              <HospitalIcon size={18} />
            </span>
            <span className="row__text">
              <small>المستشفى</small>
              {doctor.hospital}
            </span>
          </li>
          <li className="row">
            <span className="row__icon tile tile--red">
              <PinIcon size={18} />
            </span>
            <span className="row__text">
              <small>الموقع</small>
              {doctor.district}
            </span>
          </li>
          {doctor.yearsExperience !== null && (
            <li className="row">
              <span className="row__icon tile tile--orange">
                <BriefcaseIcon size={18} />
              </span>
              <span className="row__text">
                <small>الخبرة</small>
                {doctor.yearsExperience} سنة
              </span>
            </li>
          )}
          {doctor.languages.length > 0 && (
            <li className="row">
              <span className="row__icon tile tile--green">
                <GlobeIcon size={18} />
              </span>
              <span className="row__text">
                <small>اللغات</small>
                {doctor.languages.join("، ")}
              </span>
            </li>
          )}
        </ul>
        <p className="group-footer">
          المصدر: {doctor.source} · آخر تحقق: {formatDate(doctor.checkedAt)}
        </p>
      </section>

      <ul className="group list">
        <li>
          <Link href={`/corrections?profile=${doctor.slug}`} className="row row--link">
            <span className="row__icon tile tile--gray">
              <EditIcon size={18} />
            </span>
            <span className="row__text row__text--tint">طلب تصحيح أو إزالة</span>
            <ChevronIcon size={18} className="row__chev" />
          </Link>
        </li>
      </ul>
    </article>
  );
}
