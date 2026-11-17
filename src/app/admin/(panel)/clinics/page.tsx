import Link from "next/link";
import { PlusIcon } from "@/components/Icons";
import { getDb } from "@/lib/db/client";
import { listAdminClinics } from "@/lib/admin/clinics";

export default async function AdminClinics() {
  const clinics = await listAdminClinics(await getDb());
  return (
    <div className="adm-stack">
      <div className="adm-head">
        <h1>العيادات</h1>
        <Link href="/admin/clinics/new" className="btn">
          <PlusIcon size={18} />
          إضافة عيادة
        </Link>
      </div>
      <p className="updated">لكل عيادة صفحة في الموقع تعرض الأطباء المدرجين فيها. تظهر العيادة للزوار عندما يكون فيها طبيب منشور واحد على الأقل.</p>
      {clinics.length === 0 ? (
        <div className="empty">
          <p className="empty__title">لا توجد عيادات بعد</p>
          <Link href="/admin/clinics/new" className="btn">
            إضافة أول عيادة
          </Link>
        </div>
      ) : (
        <ul className="group adm-rows">
          {clinics.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/clinics/${c.id}`} className="adm-rows__title">
                {c.name}
              </Link>
              {c.is_demo ? (
                <span className="state state--demo">تجريبية</span>
              ) : c.is_hidden ? (
                <span className="state state--off">مخفية</span>
              ) : (
                <span className="state state--on">ظاهرة</span>
              )}
              <span className="adm-rows__meta">
                <span>{c.district}</span>
                <span>{c.doctor_count === 1 ? "طبيب واحد" : `${c.doctor_count} أطباء`}</span>
                <span>الترتيب: {c.position ?? "—"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
