import Link from "next/link";
import { type Doctor, displayName, doctorPath, whatsappLink } from "@/lib/doctors";
import { FavoriteButton } from "./FavoriteButton";
import { PinIcon } from "./Icons";
import { DoctorPhoto } from "./DoctorPhoto";
import { WhatsAppButton } from "./WhatsAppButton";

/**
 * A doctor as an appointment slip: the photo and the facts above the tear line; below it the
 * stub, experience and the WhatsApp action.
 */
export function DoctorSlip({ doctor }: { doctor: Doctor }) {
  const wa = whatsappLink(doctor);
  return (
    <article className="slip">
      <div className="slip__body">
        <h3 className="slip__name">
          <Link href={doctorPath(doctor)} className="stretched">
            {displayName(doctor)}
          </Link>
        </h3>
        <p className="slip__role">{doctor.role}</p>
        <p className="slip__where">
          <PinIcon size={15} />
          <span>
            {doctor.hospital}، {doctor.district.replace(/،?\s*الرياض$/, "")}
          </span>
        </p>
        {doctor.demo && (
          <p className="slip__demo">
            <span className="label label--demo">ملف تجريبي</span>
          </p>
        )}
        <div className="slip__photo">
          <DoctorPhoto doctor={doctor} decorative />
        </div>
      </div>
      <div className="slip__stub">
        <dl className="slip__cells">
          {doctor.yearsExperience !== null && (
            <div className="slip__cell">
              <dt>الخبرة</dt>
              <dd>{doctor.yearsExperience} سنة</dd>
            </div>
          )}
        </dl>
        <span className="slip__actions">
          <FavoriteButton slug={doctor.slug} name={displayName(doctor)} />
          <WhatsAppButton slug={doctor.slug} href={wa} label={wa ? "واتساب" : "غير متاح"} className="slip__wa" />
        </span>
      </div>
    </article>
  );
}
