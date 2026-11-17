"use client";

import { useActionState } from "react";
import { CheckIcon } from "@/components/Icons";
import { RELATIONSHIPS } from "@/lib/data/corrections";
import { sendCorrection, type CorrectionState } from "./actions";

export function CorrectionForm({ profiles, initialProfile }: { profiles: { slug: string; label: string }[]; initialProfile: string }) {
  const [state, action, pending] = useActionState<CorrectionState, FormData>(sendCorrection, { ok: false });

  if (state.ok) {
    return (
      <div className="empty">
        <CheckIcon size={32} className="icon" />
        <p className="empty__title">وصلنا طلبك</p>
        <p className="muted">سنراجعه ونرد عليك عبر بريدك الإلكتروني.</p>
      </div>
    );
  }

  return (
    <form action={action} className="group form">
      {state.error && (
        <p className="form__error" role="alert">
          {state.error}
        </p>
      )}
      <label className="field">
        <span>الملف المقصود</span>
        <select name="profile" defaultValue={initialProfile} required>
          <option value="" disabled>
            اختر الطبيب
          </option>
          {profiles.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>اسمك</span>
        <input name="name" required maxLength={100} autoComplete="name" />
      </label>
      <label className="field">
        <span>بريدك الإلكتروني</span>
        <input name="email" type="email" required maxLength={200} dir="ltr" autoComplete="email" />
      </label>
      <label className="field">
        <span>صلتك بالملف</span>
        <select name="relationship" defaultValue="" required>
          <option value="" disabled>
            اختر
          </option>
          {Object.entries(RELATIONSHIPS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>ما المعلومة التي تريد تصحيحها أو إزالتها؟</span>
        <textarea name="message" required maxLength={2000} rows={5} />
      </label>
      {/* Left empty by people; filled by simple spam bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>أوافق على حفظ اسمي وبريدي ورسالتي لمعالجة هذا الطلب فقط، على أن تُحذف بعد إغلاقه بمدة محددة.</span>
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "جارٍ الإرسال…" : "أرسل الطلب"}
      </button>
    </form>
  );
}
