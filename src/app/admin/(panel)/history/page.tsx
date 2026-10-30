import { getDb } from "@/lib/db/client";
import { listAudit } from "@/lib/admin/core";

const ACTIONS: Record<string, string> = {
  create: "إضافة",
  update: "تعديل",
  hide: "إخفاء",
  show: "إلغاء الإخفاء",
  delete: "حذف",
  delete_demo: "حذف الملفات التجريبية",
  upload_photo: "رفع صورة",
  remove_photo: "حذف صورة",
  close: "إغلاق طلب",
  reopen: "إعادة فتح طلب",
  erase_personal_data: "مسح بيانات شخصية",
  activate: "تفعيل مشرف",
  deactivate: "إيقاف مشرف",
  bootstrap_owner: "تسجيل المالك",
};

const TABLES: Record<string, string> = {
  doctors: "ملف طبيب",
  doctor_photos: "صورة",
  correction_requests: "طلب تصحيح",
  admin_users: "مشرف",
};

export default async function AdminHistory() {
  const rows = await listAudit(await getDb());
  return (
    <div className="adm-stack">
      <h1>سجل التغييرات</h1>
      <p className="muted adm-small">آخر 200 تغيير: مين غيّر، وش غيّر، ومتى (بتوقيت الرياض). البيانات الشخصية لأصحاب الطلبات ما تنحفظ هنا.</p>
      <div className="glass card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>الوقت</th>
              <th>المشرف</th>
              <th>الإجراء</th>
              <th>على</th>
              <th>التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td dir="ltr">{r.at}</td>
                <td>{r.admin ?? "—"}</td>
                <td>{ACTIONS[r.action] ?? r.action}</td>
                <td>
                  {TABLES[r.entity_table] ?? r.entity_table}
                  {r.target && ` · ${r.target}`}
                </td>
                <td>
                  {(r.before_data || r.after_data) ? (
                    <details>
                      <summary className="link-btn">عرض</summary>
                      <pre className="adm-pre" dir="ltr">
                        {JSON.stringify({ before: r.before_data, after: r.after_data }, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted">ما فيه تغييرات للحين.</p>}
      </div>
    </div>
  );
}
