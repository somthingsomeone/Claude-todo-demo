import Link from "next/link";
import { type Doctor, displayName, doctorPath, specialtyName, whatsappLink } from "@/lib/doctors";
import { FavoriteButton } from "./FavoriteButton";
import { PinIcon } from "./Icons";
import { Stamp } from "./Stamp";
import { WhatsAppButton } from "./WhatsAppButton";

/** A doctor as an appointment slip: facts above the tear line, contact stub below. */
export function DoctorSlip({ doctor, showSpecialty = true }: { doctor: Doctor; showSpecialty?: boolean }) {
  const wa = whatsappLink(doctor);
  return (
    <article className="slip">
      <div className="slip__body">
        {(showSpecialty || doctor.demo) && (
          <p className="slip__label">
            {doctor.demo ? (
              <span className="label label--demo">ملف تجريبي</span>
            ) : (
              <span className="label">{specialtyName(doctor.specialty)}</span>
            )}
          </p>
        )}
        <h3 className="slip__name">
          <Link href={doctorPath(doctor)} className="stretched">
            {displayName(doctor)}
          </Link>
        </h3>
        <p className="slip__role">{doctor.role}</p>
        <p className="slip__where">
          <PinIcon size={15} />
          {doctor.hospital}، {doctor.district.replace(/،?\s*الرياض$/, "")}
        </p>
        <div className="slip__stamp">
          <Stamp checkedAt={doctor.checkedAt} />
        </div>
        {doctor.photo && <img className="slip__photo" src={doctor.photo} alt="" loading="lazy" />}
      </div>
      <div className="slip__stub">
        <span className="slip__years">
          {doctor.yearsExperience !== null ? `${doctor.yearsExperience} سنة خبرة` : ""}
        </span>
        <span className="slip__actions">
          <FavoriteButton slug={doctor.slug} name={displayName(doctor)} />
          <WhatsAppButton
            slug={doctor.slug}
            href={wa}
            label={wa ? "واتساب" : "غير متاح"}
            className="slip__wa"
          />
        </span>
      </div>
    </article>
  );
}
