import { getDb } from "@/lib/db/client";
import { ROLE_LABELS } from "@/lib/admin/core";
import { listAdmins } from "@/lib/admin/admins";
import { requireAdmin } from "@/lib/admin/session";
import { addAdmin, setAdminActive } from "../../actions";

export default async function AdminAdmins() {
  const actor = await requireAdmin({ owner: true });
  const admins = await listAdmins(await getDb());
  const back = "/admin/admins";

  return (
    <div className="adm-stack">
      <h1>المشرفون</h1>
      <div className="glass card adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد</th>
              <th>الدور</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className={a.is_active ? "" : "is-off"}>
                <td>{a.display_name}</td>
                <td dir="ltr">{a.email}</td>
                <td>{ROLE_LABELS[a.role]}</td>
                <td>
                  {a.id !== actor.id && (
                    <form action={setAdminActive}>
                      <input type="hidden" name="_back" value={back} />
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="active" value={a.is_active ? "0" : "1"} />
                      <button className="link-btn">{a.is_active ? "إيقاف" : "تفعيل"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={addAdmin} className="glass card form">
        <input type="hidden" name="_back" value={back} />
        <h2 className="card__title">إضافة مشرف</h2>
        <label className="field">
          <span>الاسم</span>
          <input name="display_name" required maxLength={80} />
        </label>
        <label className="field">
          <span>البريد الإلكتروني</span>
          <input name="email" type="email" required dir="ltr" />
        </label>
        <label className="field">
          <span>الدور</span>
          <select name="role" defaultValue="editor">
            <option value="editor">مشرف (يضيف ويعدّل الأطباء والطلبات)</option>
            <option value="owner">مالك (كل الصلاحيات)</option>
          </select>
        </label>
        <button className="btn-primary">إضافة</button>
      </form>
    </div>
  );
}
