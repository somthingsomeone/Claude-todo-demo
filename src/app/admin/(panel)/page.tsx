import Link from "next/link";
import { getDb } from "@/lib/db/client";
import { listAdminDoctors } from "@/lib/admin/profiles";
import { dashboardStats, testVerdict } from "@/lib/admin/stats";

export default async function AdminHome() {
  const db = await getDb();
  const [stats, doctors] = await Promise.all([dashboardStats(db), listAdminDoctors(db)]);
  const verdict = testVerdict(stats.clicks_30d);
  // Before launch there is no real traffic, so a red "rethink" verdict would be misleading.
  const hasData = stats.doctors_public > 0 && stats.clicks_total > 0;
  const max = Math.max(1, ...stats.daily.map((d) => d.clicks));
  const top = doctors.filter((d) => d.clicks_30d > 0).sort((a, b) => b.clicks_30d - a.clicks_30d).slice(0, 5);

  return (
    <div className="adm-stack">
      <h1>الملخص</h1>

      <div className="adm-tiles">
        <div className="group group--pad adm-tile">
          <span>ضغطات واتساب في آخر 30 يومًا</span>
          <strong>{stats.clicks_30d}</strong>
        </div>
        <div className="group group--pad adm-tile">
          <span>ضغطات هذا الشهر</span>
          <strong>{stats.clicks_month}</strong>
        </div>
        <div className="group group--pad adm-tile">
          <span>أطباء منشورون (حقيقيون)</span>
          <strong>{stats.doctors_public}</strong>
        </div>
        <Link href="/admin/requests" className="group group--pad adm-tile">
          <span>طلبات تصحيح مفتوحة</span>
          <strong>{stats.requests_open}</strong>
        </Link>
      </div>

      <section className="group group--pad">
        <h2 className="section-title">هدف تجربة التسعين يومًا</h2>
        {hasData ? (
          <p className={`verdict verdict--${verdict.tone}`}>{verdict.text}</p>
        ) : (
          <p className="verdict">لا توجد بيانات كافية بعد. يبدأ القياس بعد الإطلاق ونشر أطباء حقيقيين.</p>
        )}
        <p className="updated">
          القاعدة: أكثر من 300 ضغطة في الشهر ← المرحلة الثانية · من 100 إلى 300 ← تحسين التسويق · أقل من 100 ← مراجعة الفكرة.
        </p>
      </section>

      <section className="group group--pad">
        <h2 className="section-title">الضغطات في آخر 14 يومًا</h2>
        <div className="bars" role="img" aria-label="رسم الضغطات اليومية">
          {stats.daily.map((d) => (
            <div key={d.day} className="bars__col" title={`${d.day}: ${d.clicks}`}>
              <span className="bars__val">{d.clicks || ""}</span>
              <span className="bars__bar" style={{ blockSize: `${(d.clicks / max) * 100}%` }} />
              <span className="bars__day">{d.day.slice(3)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="group group--pad">
        <h2 className="section-title">الأكثر ضغطًا (آخر 30 يومًا)</h2>
        {top.length === 0 ? (
          <p className="muted">لا توجد ضغطات بعد.</p>
        ) : (
          <ol className="adm-list">
            {top.map((d) => (
              <li key={d.id}>
                <Link href={`/admin/doctors/${d.id}`}>{d.name}</Link>
                <span>{d.clicks_30d}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {stats.doctors_demo > 0 && (
        <p className="flash flash--warn">
          يوجد {stats.doctors_demo} ملفًا تجريبيًا ظاهرًا في الموقع. تختفي تلقائيًا عند تفعيل مفتاح الإطلاق، ويمكنك حذفها من صفحة «الأطباء».
        </p>
      )}
    </div>
  );
}
