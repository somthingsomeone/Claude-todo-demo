import type { Db } from "../db/client";

export const RELATIONSHIPS = {
  self: "أنا الطبيب/الأخصائي نفسه",
  representative: "أمثّل الطبيب أو المنشأة",
  patient: "مراجع/مريض",
  other: "أخرى",
} as const;
export type Relationship = keyof typeof RELATIONSHIPS;

export class FormError extends Error {}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(values: Record<string, unknown>, key: string, max: number, label: string): string {
  const v = typeof values[key] === "string" ? (values[key] as string).trim() : "";
  if (!v) throw new FormError(`الحقل مطلوب: ${label}`);
  if (v.length > max) throw new FormError(`النص طويل جدًا: ${label}`);
  return v;
}

/**
 * Saves a correction/removal request. Stores only: name, email, relationship,
 * profile and message (+ the time consent was given).
 */
export async function submitCorrection(db: Db, values: Record<string, unknown>) {
  // Hidden field that people never fill; simple bots do.
  if (typeof values.website === "string" && values.website.trim() !== "") return;

  const name = field(values, "name", 100, "الاسم");
  const email = field(values, "email", 200, "البريد الإلكتروني").toLowerCase();
  if (!EMAIL_RE.test(email)) throw new FormError("البريد الإلكتروني غير صحيح.");
  const relationship = field(values, "relationship", 20, "صلتك بالملف") as Relationship;
  if (!(relationship in RELATIONSHIPS)) throw new FormError("اختر صلتك بالملف.");
  const profile = field(values, "profile", 200, "الملف المقصود");
  const message = field(values, "message", 2000, "الطلب");
  if (values.consent !== "on") throw new FormError("نحتاج موافقتك على حفظ بياناتك لمعالجة الطلب.");

  const [doctor] = await db.query<{ id: string; label: string }>(
    `select id, name as label from doctors where slug = $1`,
    [profile],
  );
  await db.query(
    `insert into correction_requests (doctor_id, profile_label, requester_name, requester_email, relationship, message, consent_at)
     values ($1, $2, $3, $4, $5, $6, now())`,
    [doctor?.id ?? null, doctor?.label ?? profile, name, email, relationship, message],
  );
}
