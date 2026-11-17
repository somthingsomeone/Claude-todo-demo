import type { Db } from "../db/client";
import { AdminError, audit, explainDbError, numberField, text, urlField, type Actor } from "./core";

export interface AdminClinic {
  id: string;
  slug: string;
  name: string;
  district: string;
  map_url: string | null;
  position: number | null;
  is_demo: boolean;
  is_hidden: boolean;
  doctor_count: number;
}

export async function listAdminClinics(db: Db): Promise<AdminClinic[]> {
  return db.query<AdminClinic>(
    `select c.id, c.slug, c.name, c.district, c.map_url, c.position, c.is_demo, c.is_hidden,
       count(d.id)::int as doctor_count
     from clinics c left join doctors d on d.clinic_id = c.id
     group by c.id order by c.is_demo, c.position nulls last, c.name`,
  );
}

export async function getAdminClinic(db: Db, id: string): Promise<AdminClinic | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db.query<AdminClinic>(
    `select c.id, c.slug, c.name, c.district, c.map_url, c.position, c.is_demo, c.is_hidden,
       (select count(*)::int from doctors d where d.clinic_id = c.id) as doctor_count
     from clinics c where c.id = $1`,
    [id],
  );
  return row ?? null;
}

function readClinic(values: Record<string, unknown>) {
  const slug = text(values, "slug", { required: true, max: 80, label: "الرابط المختصر" })!.toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new AdminError("الرابط المختصر: أحرف إنجليزية صغيرة وأرقام وشرطات فقط، مثل nada-medical-center");
  }
  if (slug.startsWith("demo-")) throw new AdminError("لا يبدأ الرابط المختصر بـ demo- لأنه محجوز للملفات التجريبية.");
  return {
    slug,
    name: text(values, "name", { required: true, max: 120, label: "اسم العيادة" })!,
    district: text(values, "district", { required: true, max: 120, label: "الحي" })!,
    map_url: urlField(values, "map_url", { label: "رابط الخريطة" }),
    position: numberField(values, "position", { min: 1, max: 9999, integer: true, label: "الترتيب" }),
  };
}

const COLUMNS = ["slug", "name", "district", "map_url", "position"] as const;

export async function createClinic(db: Db, actor: Actor, values: Record<string, unknown>): Promise<string> {
  const c = readClinic(values);
  try {
    const [row] = await db.query<{ id: string }>(
      `insert into clinics (${COLUMNS.join(", ")}) values ($1, $2, $3, $4, $5) returning id`,
      COLUMNS.map((k) => c[k]),
    );
    await audit(db, actor, "create", "clinics", row.id, null, c);
    return row.id;
  } catch (e) {
    explainDbError(e);
  }
}

export async function updateClinic(db: Db, actor: Actor, id: string, values: Record<string, unknown>) {
  const before = await getAdminClinic(db, id);
  if (!before) throw new AdminError("العيادة غير موجودة.");
  if (before.is_demo) throw new AdminError("لا تُعدَّل العيادات التجريبية.");
  const c = readClinic(values);
  try {
    await db.query(
      `update clinics set ${COLUMNS.map((k, i) => `${k} = $${i + 2}`).join(", ")}, updated_at = now() where id = $1`,
      [id, ...COLUMNS.map((k) => c[k])],
    );
    // Keep the doctors' copied clinic details in step.
    await db.query(`update doctors set hospital = $2, district = $3, map_url = $4, updated_at = now() where clinic_id = $1`, [
      id,
      c.name,
      c.district,
      c.map_url,
    ]);
  } catch (e) {
    explainDbError(e);
  }
  await audit(db, actor, "update", "clinics", id, before, c);
}

export async function setClinicHidden(db: Db, actor: Actor, id: string, hidden: boolean) {
  const before = await getAdminClinic(db, id);
  if (!before) throw new AdminError("العيادة غير موجودة.");
  await db.query(`update clinics set is_hidden = $2, updated_at = now() where id = $1`, [id, hidden]);
  await audit(db, actor, hidden ? "hide" : "show", "clinics", id, { is_hidden: before.is_hidden }, { is_hidden: hidden });
}

/** Options for the doctor form's clinic list. */
export async function clinicOptions(db: Db): Promise<{ id: string; label: string }[]> {
  const rows = await db.query<{ id: string; name: string; district: string; is_demo: boolean }>(
    `select id, name, district, is_demo from clinics order by is_demo, name`,
  );
  return rows.map((r) => ({ id: r.id, label: `${r.name} — ${r.district}${r.is_demo ? " (تجريبي)" : ""}` }));
}
