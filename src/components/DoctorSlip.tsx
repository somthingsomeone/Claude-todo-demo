import Link from "next/link";
import { type Doctor, displayName, doctorPath, whatsappLink } from "@/lib/doctors";
import { FavoriteButton } from "./FavoriteButton";
import { PinIcon } from "./Icons";
import { Stamp, stampDate } from "./Stamp";
import { WhatsAppButton } from "./WhatsAppButton";

/**
 * A doctor as an appointment slip: facts and the stamp above the tear line; below it the stub,
 * fixed cells (experience | last checked) and the contact actions.
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
        <div className="slip__stamp">
          <Stamp checkedAt={doctor.checkedAt} />
        </div>
        {doctor.photo && <img className="slip__photo" src={doctor.photo} alt="" loading="lazy" />}
        <span className="slip__fav">
          <FavoriteButton slug={doctor.slug} name={displayName(doctor)} />
        </span>
      </div>
      <div className="slip__stub">
        <dl className="slip__cells">
          {doctor.yearsExperience !== null && (
            <div className="slip__cell">
              <dt>الخبرة</dt>
              <dd>{doctor.yearsExperience} سنة</dd>
            </div>
          )}
          <div className="slip__cell">
            <dt>آخر تحقق</dt>
            <dd dir="ltr">{stampDate(doctor.checkedAt)}</dd>
          </div>
        </dl>
        <span className="slip__actions">
          <WhatsAppButton slug={doctor.slug} href={wa} label={wa ? "واتساب" : "غير متاح"} className="slip__wa" />
        </span>
      </div>
    </article>
  );
}
