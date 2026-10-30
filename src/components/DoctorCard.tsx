import Link from "next/link";
import { type Doctor, displayName, specialtyName } from "@/lib/doctors";
import { Avatar } from "./Avatar";
import { FavoriteButton } from "./FavoriteButton";
import { BriefcaseIcon, HospitalIcon, SpecialtyIcon } from "./Icons";

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
        {doctor.yearsExperience !== null && (
          <p className="doc-card__meta">
            <BriefcaseIcon size={14} />
            <span>{doctor.yearsExperience} سنة خبرة</span>
          </p>
        )}
      </div>

      <FavoriteButton slug={doctor.slug} name={displayName(doctor)} className="doc-card__fav" />
    </article>
  );
}
