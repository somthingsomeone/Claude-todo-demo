"use client";

import { useActionState } from "react";
import { RELATIONSHIPS } from "@/lib/data/corrections";
import { sendCorrection, type CorrectionState } from "./actions";

export function CorrectionForm({ profiles, initialProfile }: { profiles: { slug: string; label: string }[]; initialProfile: string }) {
  const [state, action, pending] = useActionState<CorrectionState, FormData>(sendCorrection, { ok: false });

  if (state.ok) {
    return (
      <div className="empty glass">
        <p className="empty__title">وصلنا طلبك ✅</p>
        <p>بنراجعه ونرد عليك على بريدك.</p>
      </div>
    );
  }

  return (
    <form action={action} className="glass card form">
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
        <span>وش تبي نصحّح أو نشيل؟</span>
        <textarea name="message" required maxLength={2000} rows={5} />
      </label>
      {/* Left empty by people; filled by simple spam bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>أوافق على حفظ اسمي وبريدي ورسالتي لمعالجة هذا الطلب فقط، وتُحذف بعد إغلاقه بمدة محددة.</span>
      </label>
      <button className="btn-primary" disabled={pending}>
        {pending ? "جاري الإرسال…" : "أرسل الطلب"}
      </button>
    </form>
  );
}
