"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SPECIALTIES } from "@/lib/doctors";
import { CONSENT_LABELS, CONSENT_METHODS, STATUS_LABELS, STATUSES, TITLES, type AdminDoctor } from "@/lib/admin/profiles";
import type { DoctorFormState } from "@/app/admin/actions";

/**
 * Add/edit form for a doctor profile. Every public fact needs a source + checked date.
 * No rating fields: profiles never rate themselves. If saving fails, the error shows
 * and everything typed stays in the form.
 */
export function DoctorForm({
  action,
  doctor,
  clinics,
  back,
  submitLabel,
}: {
  action: (prev: DoctorFormState, fd: FormData) => Promise<DoctorFormState>;
  doctor?: AdminDoctor;
  clinics: { id: string; label: string }[];
  back: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { n: 0 });
  // After a failed save, show what was typed instead of the saved values.
  const v = (name: string, fallback: string | number | null | undefined) =>
    state.values ? (state.values[name] ?? "") : (fallback ?? "");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form key={state.n} action={formAction} className="adm-form">
      {state.error && (
        <p className="flash flash--err" role="alert">
          {state.error}
        </p>
      )}
      <input type="hidden" name="_back" value={back} />
      {doctor && <input type="hidden" name="id" value={doctor.id} />}

      <fieldset className="group">
        <legend>الأساسيات</legend>
        <div className="grid-2">
          <label className="field">
            <span>الاسم (دون «د.»)</span>
            <input name="name" required maxLength={80} defaultValue={v("name", doctor?.name)} placeholder="مثال: سارة القحطاني" />
          </label>
          <label className="field">
            <span>الرابط المختصر</span>
            <input name="slug" required maxLength={80} dir="ltr" defaultValue={v("slug", doctor?.slug)} placeholder="مثال: sara-alqahtani" />
            <small>أحرف إنجليزية صغيرة وشرطات فقط، ويظهر في رابط صفحة الطبيب.</small>
          </label>
          <label className="field">
            <span>التخصص</span>
            <select name="specialty" required defaultValue={v("specialty", doctor?.specialty)}>
              <option value="" disabled>
                اختر التخصص
              </option>
              {SPECIALTIES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>اللقب</span>
            <select name="title" required defaultValue={v("title", doctor?.title)}>
              <option value="" disabled>
                اختر اللقب
              </option>
              {TITLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <small>للعلاج الطبيعي: «أخصائي» أو «أخصائية»، إلا إذا توفّر مستند يثبت لقب «د.».</small>
          </label>
          <label className="field">
            <span>مستند لقب «د.» (للعلاج الطبيعي فقط)</span>
            <input name="title_note" maxLength={200} defaultValue={v("title_note", doctor?.title_note)} placeholder="مثال: شهادة دكتوراه أرسلتها العيادة" />
          </label>
          <label className="field">
            <span>المسمّى</span>
            <input name="role" required maxLength={80} defaultValue={v("role", doctor?.role)} placeholder="مثال: استشارية جلدية" />
          </label>
        </div>
      </fieldset>

      <fieldset className="group">
        <legend>العيادة والتواصل</legend>
        <div className="grid-2">
          <label className="field">
            <span>العيادة</span>
            <select name="clinic_id" required defaultValue={v("clinic_id", doctor?.clinic_id)}>
              <option value="" disabled>
                اختر العيادة
              </option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <small>
              العيادة غير موجودة؟{" "}
              <Link href="/admin/clinics/new" className="link">
                أضفها أولًا
              </Link>
              .
            </small>
          </label>
          <label className="field">
            <span>رقم واتساب العيادة</span>
            <input
              name="whatsapp"
              dir="ltr"
              inputMode="tel"
              defaultValue={v("whatsapp", doctor?.whatsapp ? `0${doctor.whatsapp.slice(3)}` : "")}
              placeholder="مثال: 05XXXXXXXX"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="group">
        <legend>عن الطبيب</legend>
        <label className="field">
          <span>نبذة قصيرة</span>
          <textarea name="bio" rows={3} maxLength={800} defaultValue={v("bio", doctor?.bio)} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>الحالات التي يعالجها (حالة في كل سطر)</span>
            <textarea name="treats" rows={5} defaultValue={v("treats", doctor?.treats.join("\n"))} />
          </label>
          <label className="field">
            <span>اللغات (افصل بينها بفاصلة)</span>
            <input name="languages" defaultValue={v("languages", doctor?.languages.join("، ") ?? "العربية")} />
          </label>
          <label className="field">
            <span>سنوات الخبرة</span>
            <input name="years_experience" type="number" min={0} max={70} defaultValue={v("years_experience", doctor?.years_experience)} />
          </label>
          <label className="field">
            <span>الترتيب في الموقع</span>
            <input name="position" type="number" min={1} max={9999} defaultValue={v("position", doctor?.position)} placeholder="مثال: 1" />
            <small>الرقم الأصغر يظهر أولًا، ولا يُعرض هذا الرقم للزوار.</small>
          </label>
        </div>
      </fieldset>

      <fieldset className="group">
        <legend>مصدر المعلومات</legend>
        <div className="grid-2">
          <label className="field">
            <span>المصدر</span>
            <input name="source" required maxLength={300} defaultValue={v("source", doctor?.source)} placeholder="مثال: الموقع الرسمي للعيادة" />
          </label>
          <label className="field">
            <span>تاريخ آخر تحقق</span>
            <input name="checked_at" type="date" required defaultValue={v("checked_at", doctor?.checked_at ?? today)} />
          </label>
        </div>
      </fieldset>

      <fieldset className="group">
        <legend>موافقة الطبيب والنشر (لا يظهر للزوار)</legend>
        <div className="grid-2">
          <label className="field">
            <span>تاريخ موافقة الطبيب على إدراجه</span>
            <input name="consent_date" type="date" max={today} defaultValue={v("consent_date", doctor?.consent_date)} />
            <small>لا يمكن نشر الملف دون تاريخ الموافقة.</small>
          </label>
          <label className="field">
            <span>طريقة الموافقة</span>
            <select name="consent_method" defaultValue={v("consent_method", doctor?.consent_method)}>
              <option value="">—</option>
              {CONSENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {CONSENT_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>ملاحظة عن الموافقة</span>
            <input name="consent_note" maxLength={300} defaultValue={v("consent_note", doctor?.consent_note)} placeholder="مثال: وافق عبر واتساب العيادة" />
          </label>
          <label className="field">
            <span>الحالة</span>
            <select name="status" defaultValue={v("status", doctor?.status ?? "draft")}>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS[st]}
                </option>
              ))}
            </select>
            <small>«منشور» يظهر للزوار، و«مسودة» محفوظ لديك فقط.</small>
          </label>
        </div>
      </fieldset>

      <button className="btn" disabled={pending}>
        {pending ? "جارٍ الحفظ…" : submitLabel}
      </button>
    </form>
  );
}
