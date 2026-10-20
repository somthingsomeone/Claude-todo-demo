import Link from "next/link";
import { type Doctor, displayName, specialtyName } from "@/lib/doctors";
import { Avatar } from "./Avatar";
import { FavoriteButton } from "./FavoriteButton";
import { HospitalIcon, SpecialtyIcon, StarIcon } from "./Icons";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const href = `/doctors/${doctor.slug}`;
  return (
    <article className={`doc-card tint-${doctor.specialty}`}>
      <Avatar doctor={doctor} className="doc-card__photo" />

      <div className="doc-card__body">
        <div className="doc-card__top">
          <span className="tag">
            <SpecialtyIcon slug={doctor.specialty} size={14} />
            {specialtyName(doctor.specialty)}
          </span>
          {doctor.demo && <span className="tag tag--demo">تجريبي</span>}
        </div>
        <h3 className="doc-card__name">
          <Link href={href} className="stretched">
            {displayName(doctor)}
          </Link>
        </h3>
        <p className="doc-card__role">{doctor.role}</p>
        <p className="doc-card__place">
          <HospitalIcon size={15} />
          {doctor.hospital}
        </p>
        <p className="doc-card__meta">
          {doctor.rating === null ? (
            <span className="muted">لا يوجد تقييم</span>
          ) : (
            <span className="doc-card__rating">
              <StarIcon size={14} className="star-gold" />
              <b>{doctor.rating.toFixed(1)}</b>
              <span className="muted">({doctor.ratingCount ?? 0})</span>
            </span>
          )}
          {doctor.yearsExperience !== null && (
            <>
              <span className="dot" aria-hidden="true" />
              <span>{doctor.yearsExperience} سنة خبرة</span>
            </>
          )}
        </p>
      </div>

      <FavoriteButton slug={doctor.slug} name={displayName(doctor)} className="doc-card__fav" />
    </article>
  );
}
