import Link from "next/link";
import { getDb } from "@/lib/db/client";
import { listAdminDoctors } from "@/lib/admin/profiles";
import { dashboardStats, testVerdict } from "@/lib/admin/stats";

export default async function AdminHome() {
  const db = await getDb();
  const [stats, doctors] = await Promise.all([dashboardStats(db), listAdminDoctors(db)]);
  const verdict = testVerdict(stats.clicks_30d);
  const max = Math.max(1, ...stats.daily.map((d) => d.clicks));
  const top = doctors.filter((d) => d.clicks_30d > 0).sort((a, b) => b.clicks_30d - a.clicks_30d).slice(0, 5);

  return (
    <div className="adm-stack">
      <h1>الملخص</h1>

      <div className="adm-tiles">
        <div className="glass card adm-tile">
          <span>ضغطات واتساب — آخر 30 يوم</span>
          <strong>{stats.clicks_30d}</strong>
        </div>
        <div className="glass card adm-tile">
          <span>ضغطات هذا الشهر</span>
          <strong>{stats.clicks_month}</strong>
        </div>
        <div className="glass card adm-tile">
          <span>أطباء ظاهرين (حقيقيين)</span>
          <strong>{stats.doctors_public}</strong>
        </div>
        <Link href="/admin/requests" className="glass card adm-tile">
          <span>طلبات تصحيح مفتوحة</span>
          <strong>{stats.requests_open}</strong>
        </Link>
      </div>

      <section className="glass card">
        <h2 className="card__title">هدف تجربة الـ90 يوم</h2>
        <p className={`verdict verdict--${verdict.tone}`}>{verdict.text}</p>
        <p className="muted adm-small">
          القاعدة: أكثر من 300 ضغطة بالشهر ← المرحلة الثانية · 100–300 ← نحسّن التسويق · أقل من 100 ← نراجع الفكرة.
        </p>
      </section>

      <section className="glass card">
        <h2 className="card__title">الضغطات آخر 14 يوم</h2>
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

      <section className="glass card">
        <h2 className="card__title">الأكثر ضغطًا (30 يوم)</h2>
        {top.length === 0 ? (
          <p className="muted">ما فيه ضغطات للحين.</p>
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
          فيه {stats.doctors_demo} ملف تجريبي ظاهر بالموقع. احذفهم من صفحة «الأطباء» قبل الإطلاق.
        </p>
      )}
    </div>
  );
}
