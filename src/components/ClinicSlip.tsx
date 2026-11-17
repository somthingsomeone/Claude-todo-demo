import Link from "next/link";
import { type Clinic, clinicPath, specialtyName } from "@/lib/doctors";
import { BuildingIcon } from "./Icons";

export function ClinicSlip({ clinic }: { clinic: Clinic }) {
  return (
    <article className="slip clinic-slip">
      <div className="slip__body">
        {clinic.demo && (
          <p className="slip__label">
            <span className="label label--demo">عيادة تجريبية</span>
          </p>
        )}
        <h3 className="slip__name">
          <Link href={clinicPath(clinic.slug)} className="stretched">
            {clinic.name}
          </Link>
        </h3>
        <p className="slip__where">
          <BuildingIcon size={15} />
          {clinic.district}
        </p>
        <ul className="clinic-slip__specs">
          {clinic.specialties.map((s) => (
            <li key={s} className="label">
              {specialtyName(s)}
            </li>
          ))}
        </ul>
      </div>
      <div className="slip__stub">
        <span className="slip__years">{clinic.doctorCount === 1 ? "طبيب واحد" : `${clinic.doctorCount} أطباء`}</span>
        <span className="shelf__more">عرض العيادة</span>
      </div>
    </article>
  );
}
