import type { Db } from "../db/client";
import { AdminError, audit, type Actor } from "./core";

export interface RequestRow {
  id: string;
  doctor_id: string | null;
  profile_label: string;
  requester_name: string | null;
  requester_email: string | null;
  relationship: string | null;
  message: string | null;
  status: "open" | "closed";
  created_at: string;
  closed_at: string | null;
  erased_at: string | null;
}

/** Days to keep personal details of closed requests. Empty until the lawyer decides. */
export function retentionDays(env = process.env): number | null {
  const n = Number(env.CORRECTION_RETENTION_DAYS);
  return env.CORRECTION_RETENTION_DAYS && Number.isInteger(n) && n > 0 ? n : null;
}

const ERASE_SET = `requester_name = null, requester_email = null, message = null, erased_at = now()`;

/** Erases personal details of requests closed longer than the retention period. */
export async function purgeExpired(db: Db, days = retentionDays()) {
  if (!days) return 0;
  const rows = await db.query(
    `update correction_requests set ${ERASE_SET}
     where status = 'closed' and erased_at is null and closed_at < now() - make_interval(days => $1)
     returning id`,
    [days],
  );
  return rows.length;
}

export async function listRequests(db: Db): Promise<RequestRow[]> {
  await purgeExpired(db);
  return db.query<RequestRow>(
    `select id, doctor_id, profile_label, requester_name, requester_email, relationship, message, status,
       to_char(created_at at time zone 'Asia/Riyadh', 'YYYY-MM-DD HH24:MI') as created_at,
       to_char(closed_at at time zone 'Asia/Riyadh', 'YYYY-MM-DD') as closed_at,
       to_char(erased_at at time zone 'Asia/Riyadh', 'YYYY-MM-DD') as erased_at
     from correction_requests order by (status = 'open') desc, created_at desc limit 200`,
  );
}

export async function setRequestStatus(db: Db, actor: Actor, id: string, status: "open" | "closed") {
  const rows = await db.query(
    `update correction_requests set status = $2, closed_at = case when $2 = 'closed' then now() else null end
     where id = $1 returning id`,
    [id, status],
  );
  if (!rows.length) throw new AdminError("الطلب غير موجود.");
  await audit(db, actor, status === "closed" ? "close" : "reopen", "correction_requests", id, null, { status });
}

export async function eraseRequest(db: Db, actor: Actor, id: string) {
  const rows = await db.query(
    `update correction_requests set ${ERASE_SET} where id = $1 and status = 'closed' returning id`,
    [id],
  );
  if (!rows.length) throw new AdminError("أغلق الطلب أولًا ثم امسح بياناته.");
  await audit(db, actor, "erase_personal_data", "correction_requests", id, null, null);
}
