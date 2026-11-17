import Link from "next/link";
import { getDb } from "@/lib/db/client";
import { RELATIONSHIPS, type Relationship } from "@/lib/data/corrections";
import { listRequests, retentionDays } from "@/lib/admin/requests";
import { eraseRequest, setRequestStatus } from "../../actions";

export default async function AdminRequests() {
  const requests = await listRequests(await getDb());
  const days = retentionDays();
  const back = "/admin/requests";

  return (
    <div className="adm-stack">
      <h1>طلبات التصحيح والإزالة</h1>
      <p className="muted updated">
        {days
          ? `تُمسح البيانات الشخصية للطلبات المغلقة تلقائيًا بعد ${days} يومًا.`
          : "لم تُحدَّد مدة حفظ البيانات بعد (بانتظار المحامي). ويمكنك مسحها يدويًا بعد إغلاق الطلب."}
      </p>

      {requests.length === 0 && <p className="muted">لا توجد طلبات.</p>}

      {requests.map((r) => (
        <article key={r.id} className={`group group--pad adm-req ${r.status === "closed" ? "is-closed" : ""}`}>
          <div className="adm-req__head">
            <strong>
              {r.doctor_id ? (
                <Link href={`/admin/doctors/${r.doctor_id}`} className="link">
                  {r.profile_label}
                </Link>
              ) : (
                r.profile_label
              )}
            </strong>
            <span className={`state ${r.status === "open" ? "state--on" : "state--off"}`}>
              {r.status === "open" ? "مفتوح" : "مغلق"}
            </span>
            <small className="muted">{r.created_at}</small>
          </div>
          {r.erased_at ? (
            <p className="muted">تم مسح البيانات الشخصية بتاريخ {r.erased_at}.</p>
          ) : (
            <>
              <p>
                <b>{r.requester_name}</b> ·{" "}
                <a href={`mailto:${r.requester_email}`} dir="ltr" className="link">
                  {r.requester_email}
                </a>{" "}
                · {r.relationship ? RELATIONSHIPS[r.relationship as Relationship] : ""}
              </p>
              <p className="adm-req__msg">{r.message}</p>
            </>
          )}
          <div className="adm-req__actions">
            <form action={setRequestStatus}>
              <input type="hidden" name="_back" value={back} />
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="status" value={r.status === "open" ? "closed" : "open"} />
              <button className="btn btn--quiet">{r.status === "open" ? "إغلاق الطلب" : "إعادة فتح"}</button>
            </form>
            {r.status === "closed" && !r.erased_at && (
              <form action={eraseRequest}>
                <input type="hidden" name="_back" value={back} />
                <input type="hidden" name="id" value={r.id} />
                <button className="btn-danger">مسح البيانات الشخصية</button>
              </form>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
