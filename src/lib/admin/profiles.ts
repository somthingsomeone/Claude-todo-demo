import type { Db } from "../db/client";
import { SPECIALTIES, type SpecialtySlug } from "../doctors";
import {
  AdminError,
  audit,
  containsIdLikeNumber,
  dateField,
  explainDbError,
  listField,
  numberField,
  oneOf,
  text,
  urlField,
  type Actor,
} from "./core";

export const TITLES = ["د.", "أخصائي علاج طبيعي", "أخصائية علاج طبيعي"] as const;
export const STATUSES = ["draft", "published"] as const;
export type DoctorStatus = (typeof STATUSES)[number];
export const STATUS_LABELS: Record<DoctorStatus, string> = { draft: "مسودة", published: "منشور" };
export const CONSENT_METHODS = ["whatsapp", "email", "paper"] as const;
export type ConsentMethod = (typeof CONSENT_METHODS)[number];
export const CONSENT_LABELS: Record<ConsentMethod, string> = { whatsapp: "واتساب", email: "بريد إلكتروني", paper: "ورقي" };
const SPECIALTY_SLUGS = SPECIALTIES.map((s) => s.slug) as SpecialtySlug[];

export interface AdminDoctor {
  id: string;
  slug: string;
  name: string;
  title: string;
  title_note: string | null;
  specialty: SpecialtySlug;
  role: string;
  hospital: string;
  district: string;
  map_url: string | null;
  bio: string;
  treats: string[];
  languages: string[];
  years_experience: number | null;
  whatsapp: string;
  source: string;
  checked_at: string;
  status: DoctorStatus;
  consent_date: string | null;
  consent_method: ConsentMethod | null;
  consent_note: string | null;
  is_demo: boolean;
  is_hidden: boolean;
  has_photo: boolean;
  photo_permission_note: string | null;
}

export interface AdminDoctorRow {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialty: SpecialtySlug;
  hospital: string;
  is_demo: boolean;
  is_hidden: boolean;
  status: DoctorStatus;
  has_consent: boolean;
  whatsapp: string;
  clicks_total: number;
  clicks_30d: number;
}

/** Turns 05XXXXXXXX / +9665XXXXXXXX / 9665XXXXXXXX into 9665XXXXXXXX. */
export function normalizeSaudiMobile(input: string | null): string {
  if (!input) return "";
  const digits = input
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\D/g, "")
    .replace(/^00/, "");
  const local = digits.startsWith("966") ? digits.slice(3) : digits.replace(/^0/, "");
  if (!/^5\d{8}$/.test(local)) throw new AdminError("رقم واتساب غير صحيح. مثال صحيح: 05XXXXXXXX");
  return `966${local}`;
}

export async function listAdminDoctors(db: Db): Promise<AdminDoctorRow[]> {
  return db.query<AdminDoctorRow>(
    `select d.id, d.slug, d.name, d.title, d.specialty, d.hospital, d.is_demo, d.is_hidden, d.status,
       (d.consent_date is not null) as has_consent, d.whatsapp,
       coalesce(sum(c.clicks), 0)::int as clicks_total,
       coalesce(sum(c.clicks) filter (where c.day > (now() at time zone 'Asia/Riyadh')::date - 30), 0)::int as clicks_30d
     from doctors d left join whatsapp_clicks c on c.doctor_id = d.id
     group by d.id
     order by d.is_demo, d.name`,
  );
}

export async function getAdminDoctor(db: Db, id: string): Promise<AdminDoctor | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db.query<AdminDoctor>(
    `select d.id, d.slug, d.name, d.title, d.title_note, d.specialty, d.role, d.hospital, d.district, d.map_url, d.bio,
       d.treats, d.languages, d.years_experience, d.whatsapp,
       d.source, to_char(d.checked_at, 'YYYY-MM-DD') as checked_at, d.status,
       to_char(d.consent_date, 'YYYY-MM-DD') as consent_date, d.consent_method, d.consent_note,
       d.is_demo, d.is_hidden, (p.doctor_id is not null) as has_photo, p.permission_note as photo_permission_note
     from doctors d left join doctor_photos p on p.doctor_id = d.id
     where d.id = $1`,
    [id],
  );
  return row ?? null;
}

function readDoctor(values: Record<string, unknown>) {
  const slug = text(values, "slug", { required: true, max: 80, label: "الرابط المختصر" })!.toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new AdminError("الرابط المختصر: أحرف إنجليزية صغيرة وأرقام وشرطات فقط، مثل sara-alqahtani");
  }
  if (slug.startsWith("demo-")) throw new AdminError("الرابط المختصر لا يبدأ بـ demo- (محجوز للملفات التجريبية).");
  const titleNote = text(values, "title_note", { max: 200, label: "مستند اللقب" });
  if (containsIdLikeNumber(titleNote)) throw new AdminError("لا تكتب أرقامًا طويلة في ملاحظة اللقب.");
  const consentNote = text(values, "consent_note", { max: 300, label: "ملاحظة الموافقة" });
  if (containsIdLikeNumber(consentNote)) throw new AdminError("لا تكتب أرقام هوية أو أرقامًا طويلة في ملاحظة الموافقة.");
  const consentDate = dateField(values, "consent_date", { label: "تاريخ الموافقة" });
  const consentMethod = oneOf(values, "consent_method", CONSENT_METHODS, { label: "طريقة الموافقة" });
  if (consentDate && !consentMethod) throw new AdminError("اختر طريقة موافقة الطبيب (واتساب، بريد، ورقي).");
  if (consentDate && consentDate > new Date().toISOString().slice(0, 10)) throw new AdminError("تاريخ الموافقة ما يكون في المستقبل.");
  const status = oneOf(values, "status", STATUSES, { label: "الحالة" }) ?? "draft";
  if (status === "published" && !consentDate) {
    throw new AdminError("ما يمديك تنشر الملف بدون تاريخ موافقة الطبيب. احفظه كمسودة أو أضف تاريخ الموافقة.");
  }

  return {
    slug,
    name: text(values, "name", { required: true, max: 80, label: "الاسم" })!,
    title: oneOf(values, "title", TITLES, { required: true, label: "اللقب" })!,
    title_note: titleNote,
    specialty: oneOf(values, "specialty", SPECIALTY_SLUGS, { required: true, label: "التخصص" })!,
    role: text(values, "role", { required: true, max: 80, label: "المسمى" })!,
    hospital: text(values, "hospital", { required: true, max: 120, label: "المستشفى/العيادة" })!,
    district: text(values, "district", { required: true, max: 120, label: "الحي" })!,
    map_url: urlField(values, "map_url", { label: "رابط الخريطة" }),
    bio: text(values, "bio", { max: 800, label: "النبذة" }) ?? "",
    treats: listField(values, "treats", { max: 20, label: "يعالج" }),
    languages: listField(values, "languages", { max: 8, label: "اللغات" }),
    years_experience: numberField(values, "years_experience", { min: 0, max: 70, integer: true, label: "سنوات الخبرة" }),
    whatsapp: normalizeSaudiMobile(text(values, "whatsapp", { max: 30, label: "واتساب" })),
    source: text(values, "source", { required: true, max: 300, label: "المصدر" })!,
    checked_at: dateField(values, "checked_at", { required: true, label: "تاريخ التحقق" })!,
    status,
    consent_date: consentDate,
    consent_method: consentDate ? consentMethod : null,
    consent_note: consentNote,
  };
}

// Ratings are not entered by admins (the profile must not "rate itself").
const COLUMNS = [
  "slug", "name", "title", "title_note", "specialty", "role", "hospital", "district", "map_url", "bio", "treats",
  "languages", "years_experience", "whatsapp", "source", "checked_at", "status", "consent_date", "consent_method",
  "consent_note",
] as const;

export async function createDoctor(db: Db, actor: Actor, values: Record<string, unknown>): Promise<string> {
  const d = readDoctor(values);
  try {
    const [row] = await db.query<{ id: string }>(
      `insert into doctors (${COLUMNS.join(", ")})
       values (${COLUMNS.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
      COLUMNS.map((c) => d[c]),
    );
    await audit(db, actor, "create", "doctors", row.id, null, d);
    return row.id;
  } catch (e) {
    explainDbError(e);
  }
}

export async function updateDoctor(db: Db, actor: Actor, id: string, values: Record<string, unknown>) {
  const before = await getAdminDoctor(db, id);
  if (!before) throw new AdminError("الملف غير موجود.");
  if (before.is_demo) throw new AdminError("الملفات التجريبية لا تُعدّل. أضف ملفًا حقيقيًا جديدًا.");
  const d = readDoctor(values);
  try {
    await db.query(
      `update doctors set ${COLUMNS.map((c, i) => `${c} = $${i + 2}`).join(", ")}, updated_at = now() where id = $1`,
      [id, ...COLUMNS.map((c) => d[c])],
    );
  } catch (e) {
    explainDbError(e);
  }
  await audit(db, actor, "update", "doctors", id, before, d);
}

export async function setHidden(db: Db, actor: Actor, id: string, hidden: boolean) {
  const before = await getAdminDoctor(db, id);
  if (!before) throw new AdminError("الملف غير موجود.");
  await db.query(`update doctors set is_hidden = $2, updated_at = now() where id = $1`, [id, hidden]);
  await audit(db, actor, hidden ? "hide" : "show", "doctors", id, { is_hidden: before.is_hidden }, { is_hidden: hidden });
}

export async function deleteDoctor(db: Db, actor: Actor, id: string, confirmName: string) {
  const before = await getAdminDoctor(db, id);
  if (!before) throw new AdminError("الملف غير موجود.");
  if (confirmName.trim() !== before.name) throw new AdminError("للتأكيد اكتب الاسم كما هو بالضبط.");
  await db.query(`delete from doctors where id = $1`, [id]);
  await audit(db, actor, "delete", "doctors", id, { slug: before.slug, name: before.name }, null);
}

export async function deleteAllDemo(db: Db, actor: Actor) {
  const rows = await db.query<{ id: string }>(`delete from doctors where is_demo returning id`);
  await audit(db, actor, "delete_demo", "doctors", "*", null, { deleted: rows.length });
  return rows.length;
}

/* Photos ------------------------------------------------------------------ */

export const PHOTO_MAX_BYTES = 1.5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Checks the real file signature, not just the name or declared type. */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  return null;
}

export async function savePhoto(
  db: Db,
  actor: Actor,
  id: string,
  file: { bytes: Uint8Array; size: number },
  values: Record<string, unknown>,
) {
  const doctor = await getAdminDoctor(db, id);
  if (!doctor) throw new AdminError("الملف غير موجود.");
  if (doctor.is_demo) throw new AdminError("لا تُضاف صور للملفات التجريبية.");
  if (values.permission !== "on") throw new AdminError("لا تُرفع صورة إلا بعد إذن الطبيب. أكّد الإذن أولًا.");
  const note = text(values, "permission_note", { required: true, max: 300, label: "كيف أخذنا الإذن" })!;
  if (file.size === 0) throw new AdminError("اختر صورة.");
  if (file.size > PHOTO_MAX_BYTES) throw new AdminError("الصورة كبيرة. الحد الأقصى 1.5 ميجابايت.");
  const mime = sniffImageType(file.bytes);
  if (!mime || !PHOTO_TYPES.includes(mime)) throw new AdminError("الصيغ المسموحة: JPG أو PNG أو WEBP.");
  await db.query(
    `insert into doctor_photos (doctor_id, mime, data, permission_note) values ($1, $2, $3, $4)
     on conflict (doctor_id) do update set mime = excluded.mime, data = excluded.data,
       permission_note = excluded.permission_note, uploaded_at = now()`,
    [id, mime, file.bytes, note],
  );
  await audit(db, actor, "upload_photo", "doctor_photos", id, null, { mime, size: file.size, permission_note: note });
}

export async function removePhoto(db: Db, actor: Actor, id: string) {
  await db.query(`delete from doctor_photos where doctor_id = $1`, [id]);
  await audit(db, actor, "remove_photo", "doctor_photos", id, null, null);
}
