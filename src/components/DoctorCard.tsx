import Link from "next/link";
import { type Doctor, displayName, specialtyName } from "@/lib/doctors";
import { Avatar } from "./Avatar";
import { FavoriteButton } from "./FavoriteButton";
import { HospitalIcon, SpecialtyIcon, StarIcon } from "./Icons";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const href = `/doctors/${doctor.slug}`;
  return (
    <article className={`doc-card tint-${doctor.specialty}`}>
      <div className="doc-card__top">
        <span className="pill pill--glass">
          <SpecialtyIcon slug={doctor.specialty} size={15} />
          {specialtyName(doctor.specialty)}
        </span>
        {doctor.demo && <span className="pill pill--demo">تجريبي</span>}
        <FavoriteButton slug={doctor.slug} name={displayName(doctor)} className="doc-card__fav" />
      </div>

      <div className="doc-card__text">
        <p className="doc-card__role">{doctor.role}</p>
        <h3 className="doc-card__name">
          <Link href={href} className="stretched">
            {displayName(doctor)}
          </Link>
        </h3>
        <p className="doc-card__place">
          <HospitalIcon size={16} />
          {doctor.hospital}
        </p>
      </div>

      <Avatar doctor={doctor} className="doc-card__photo" />

      <dl className="doc-card__stats">
        <div className="glass-stat">
          <dt className="sr-only">التقييم</dt>
          <dd>
            <strong>
              {doctor.rating.toFixed(1)} <StarIcon size={14} className="star-gold" />
            </strong>
            <span>{doctor.ratingCount} تقييم</span>
          </dd>
        </div>
        <div className="glass-stat">
          <dt className="sr-only">الخبرة</dt>
          <dd>
            <strong>{doctor.yearsExperience}+</strong>
            <span>سنة خبرة</span>
          </dd>
        </div>
      </dl>
    </article>
  );
}
