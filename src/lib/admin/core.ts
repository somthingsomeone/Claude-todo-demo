import type { Db } from "../db/client";

export type AdminRole = "owner" | "editor";
export interface Actor {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
}

export const ROLE_LABELS: Record<AdminRole, string> = { owner: "مالك", editor: "مشرف" };

/** Error with a message that is safe to show to the admin (Arabic). */
export class AdminError extends Error {}

export function assertOwner(actor: Actor) {
  if (actor.role !== "owner") throw new AdminError("هذا الإجراء للمالك فقط.");
}

/** True if the text contains 10 or more digits in a row (spaces/dashes ignored), e.g. an ID number. */
export function containsIdLikeNumber(text: string | null | undefined): boolean {
  if (!text) return false;
  const latin = text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const runs = latin.match(/\d[\d\s-]*\d/g) ?? [];
  return runs.some((run) => run.replace(/\D/g, "").length >= 10);
}

const REDACT: Record<string, string[]> = {
  correction_requests: ["requester_name", "requester_email", "message"],
  doctor_photos: ["data"],
};

/** Change history. Personal details of people who send requests are never copied here. */
export async function audit(
  db: Db,
  actor: Actor | null,
  action: string,
  table: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
) {
  const redact = (v: unknown) => {
    if (!v || typeof v !== "object") return v ?? null;
    const copy: Record<string, unknown> = { ...(v as Record<string, unknown>) };
    for (const k of REDACT[table] ?? []) if (k in copy) copy[k] = "[محجوب]";
    return copy;
  };
  await db.query(
    `insert into audit_log (admin_id, action, entity_table, entity_id, before_data, after_data)
     values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
    [actor?.id ?? null, action, table, entityId, JSON.stringify(redact(before)), JSON.stringify(redact(after))],
  );
}

/* Form readers ----------------------------------------------------------- */

export function text(
  values: Record<string, unknown>,
  key: string,
  opts: { required?: boolean; max?: number; label?: string } = {},
): string | null {
  const raw = values[key];
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) {
    if (opts.required) throw new AdminError(`الحقل مطلوب: ${opts.label ?? key}`);
    return null;
  }
  if (opts.max && v.length > opts.max) throw new AdminError(`النص طويل جدًا: ${opts.label ?? key}`);
  return v;
}

export function numberField(
  values: Record<string, unknown>,
  key: string,
  opts: { required?: boolean; min?: number; max?: number; integer?: boolean; label?: string } = {},
): number | null {
  const v = text(values, key, opts);
  if (v === null) return null;
  const n = Number(v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
  const bad =
    !Number.isFinite(n) ||
    (opts.integer && !Number.isInteger(n)) ||
    (opts.min !== undefined && n < opts.min) ||
    (opts.max !== undefined && n > opts.max);
  if (bad) throw new AdminError(`رقم غير صحيح: ${opts.label ?? key}`);
  return n;
}

export function oneOf<T extends string>(
  values: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  opts: { required?: boolean; label?: string } = {},
): T | null {
  const v = text(values, key, opts);
  if (v === null) return null;
  if (!(allowed as readonly string[]).includes(v)) throw new AdminError(`اختيار غير صحيح: ${opts.label ?? key}`);
  return v as T;
}

export function dateField(values: Record<string, unknown>, key: string, opts: { required?: boolean; label?: string } = {}) {
  const v = text(values, key, opts);
  if (v === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) {
    throw new AdminError(`تاريخ غير صحيح: ${opts.label ?? key}`);
  }
  return v;
}

export function urlField(values: Record<string, unknown>, key: string, opts: { required?: boolean; label?: string } = {}) {
  const v = text(values, key, { ...opts, max: 1000 });
  if (v === null) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
  } catch {
    throw new AdminError(`رابط غير صحيح: ${opts.label ?? key}`);
  }
  return v;
}

/** One item per line (or separated by "،" / ","). */
export function listField(values: Record<string, unknown>, key: string, opts: { max?: number; label?: string } = {}) {
  const v = text(values, key, { max: 2000, label: opts.label });
  if (!v) return [];
  const items = v
    .split(/\n|،|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (opts.max && items.length > opts.max) throw new AdminError(`عناصر كثيرة: ${opts.label ?? key}`);
  return items;
}

export const bool = (values: Record<string, unknown>, key: string) =>
  values[key] === "on" || values[key] === "true" || values[key] === true;

/** Friendly messages for database rule violations. */
export function explainDbError(e: unknown): never {
  if (e instanceof AdminError) throw e;
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("name_without_honorific")) throw new AdminError("اكتب الاسم بدون لقب (مثل د.). اللقب يُختار من قائمة اللقب.");
  if (msg.includes("doctor_title_matches_specialty")) throw new AdminError("لقب «أخصائي علاج طبيعي» للعلاج الطبيعي فقط.");
  if (msg.includes("physio_doctor_title_needs_proof")) throw new AdminError("لقب «د.» لأخصائي العلاج الطبيعي يحتاج ملاحظة عن المستند الذي يثبته.");
  if (msg.includes("whatsapp")) throw new AdminError("رقم واتساب يجب أن يكون بصيغة 9665XXXXXXXX.");
  if (msg.includes("duplicate key") || msg.includes("unique")) throw new AdminError("هذا السجل موجود مسبقًا (الرابط المختصر مستخدم).");
  throw e;
}
