import Link from "next/link";
import { PlusIcon } from "@/components/Icons";
import { getDb } from "@/lib/db/client";
import { specialtyName } from "@/lib/doctors";
import { listAdminDoctors } from "@/lib/admin/profiles";
import { requireAdmin } from "@/lib/admin/session";
import { deleteAllDemo } from "../../actions";

export default async function AdminDoctors() {
  const actor = await requireAdmin();
  const doctors = await listAdminDoctors(await getDb());
  const demoCount = doctors.filter((d) => d.is_demo).length;

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <h1>الأطباء</h1>
        <Link href="/admin/doctors/new" className="btn">
          <PlusIcon size={18} />
          إضافة طبيب
        </Link>
      </div>
      <p className="updated">يظهر الأطباء للزوار بحسب «الترتيب» الذي تحدده في ملف كل طبيب (الأصغر أولًا). لا يُعرض هذا الرقم في الموقع.</p>

      {doctors.length === 0 ? (
        <div className="empty">
          <p className="empty__title">لا يوجد أطباء بعد</p>
          <Link href="/admin/doctors/new" className="btn">
            إضافة أول طبيب
          </Link>
        </div>
      ) : (
        <ul className="group adm-rows">
          {doctors.map((d) => (
            <li key={d.id}>
              <Link href={`/admin/doctors/${d.id}`} className="adm-rows__title">
                {d.name}
              </Link>
              {d.is_demo ? (
                <span className="state state--demo">تجريبي</span>
              ) : d.is_hidden ? (
                <span className="state state--off">مخفي مؤقتًا</span>
              ) : d.status === "draft" ? (
                <span className="state state--off">{d.has_consent ? "مسودة" : "مسودة دون موافقة"}</span>
              ) : (
                <span className="state state--on">منشور</span>
              )}
              <span className="adm-rows__meta">
                <span>{specialtyName(d.specialty)}</span>
                <span>{d.hospital}</span>
                <span>الترتيب: {d.position ?? "—"}</span>
                <span>واتساب: {d.clicks_30d} ضغطة في 30 يومًا ({d.clicks_total} إجمالًا)</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {demoCount > 0 && actor.role === "owner" && (
        <form action={deleteAllDemo} className="group form adm-danger">
          <input type="hidden" name="_back" value="/admin/doctors" />
          <h2 className="section-title">حذف الملفات التجريبية ({demoCount})</h2>
          <p className="muted">
            تختفي الملفات التجريبية تلقائيًا عند الإطلاق. وإن أردت حذفها نهائيًا من قاعدة البيانات فاكتب كلمة «احذف» للتأكيد.
          </p>
          <label className="field">
            <span>التأكيد</span>
            <input name="confirm" required autoComplete="off" />
          </label>
          <button className="btn-danger">حذف الملفات التجريبية نهائيًا</button>
        </form>
      )}
    </div>
  );
}
