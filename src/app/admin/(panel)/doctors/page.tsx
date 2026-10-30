import Link from "next/link";
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
        <Link href="/admin/doctors/new" className="btn-primary">
          + إضافة طبيب
        </Link>
      </div>

      <div className="glass card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>التخصص</th>
              <th>الحالة</th>
              <th>ضغطات 30 يوم</th>
              <th>كل الضغطات</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d.id}>
                <td>
                  <Link href={`/admin/doctors/${d.id}`} className="text-link">
                    {d.name}
                  </Link>
                  <small className="muted"> · {d.hospital}</small>
                </td>
                <td>{specialtyName(d.specialty)}</td>
                <td>
                  {d.is_demo ? (
                    <span className="pill pill--demo">تجريبي</span>
                  ) : d.is_hidden ? (
                    <span className="pill pill--off">مخفي مؤقتًا</span>
                  ) : d.status === "draft" ? (
                    <span className="pill pill--off">{d.has_consent ? "مسودة" : "مسودة · بدون موافقة"}</span>
                  ) : (
                    <span className="pill pill--on">ظاهر</span>
                  )}
                </td>
                <td>{d.clicks_30d}</td>
                <td>{d.clicks_total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {doctors.length === 0 && <p className="muted">ما فيه أطباء للحين. اضغط «إضافة طبيب».</p>}
      </div>

      {demoCount > 0 && actor.role === "owner" && (
        <form action={deleteAllDemo} className="glass card form adm-danger">
          <input type="hidden" name="_back" value="/admin/doctors" />
          <h2 className="card__title">حذف الملفات التجريبية ({demoCount})</h2>
          <p className="muted">قبل الإطلاق احذف كل الملفات الوهمية. للتأكيد اكتب كلمة «احذف».</p>
          <label className="field">
            <span>التأكيد</span>
            <input name="confirm" required autoComplete="off" />
          </label>
          <button className="btn-danger">حذف كل الملفات التجريبية</button>
        </form>
      )}
    </div>
  );
}
