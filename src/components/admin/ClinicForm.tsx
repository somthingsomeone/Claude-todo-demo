"use client";

import { useActionState } from "react";
import type { AdminClinic } from "@/lib/admin/clinics";
import type { ClinicFormState } from "@/app/admin/actions";

/** Add/edit a clinic. On error, the message shows and what was typed stays. */
export function ClinicForm({
  action,
  clinic,
  submitLabel,
}: {
  action: (prev: ClinicFormState, fd: FormData) => Promise<ClinicFormState>;
  clinic?: AdminClinic;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { n: 0 });
  const v = (name: string, fallback: string | number | null | undefined) =>
    state.values ? (state.values[name] ?? "") : (fallback ?? "");
  return (
    <form key={state.n} action={formAction} className="adm-form">
      {state.error && (
        <p className="flash flash--err" role="alert">
          {state.error}
        </p>
      )}
      {clinic && <input type="hidden" name="id" value={clinic.id} />}
      <fieldset className="group">
        <legend>بيانات العيادة</legend>
        <div className="grid-2">
          <label className="field">
            <span>اسم العيادة أو المستشفى</span>
            <input name="name" required maxLength={120} defaultValue={v("name", clinic?.name)} placeholder="مثال: مركز الندى الطبي" />
          </label>
          <label className="field">
            <span>الرابط المختصر</span>
            <input name="slug" required maxLength={80} dir="ltr" defaultValue={v("slug", clinic?.slug)} placeholder="مثال: nada-medical-center" />
            <small>أحرف إنجليزية صغيرة وشرطات فقط، ويظهر في رابط صفحة العيادة.</small>
          </label>
          <label className="field">
            <span>الحي</span>
            <input name="district" required maxLength={120} defaultValue={v("district", clinic?.district)} placeholder="مثال: حي النرجس، الرياض" />
          </label>
          <label className="field">
            <span>رابط الخريطة (اختياري)</span>
            <input name="map_url" type="url" dir="ltr" defaultValue={v("map_url", clinic?.map_url)} placeholder="مثال: https://maps.app.goo.gl/…" />
          </label>
          <label className="field">
            <span>الترتيب في الموقع</span>
            <input name="position" type="number" min={1} max={9999} defaultValue={v("position", clinic?.position)} placeholder="مثال: 1" />
            <small>الرقم الأصغر يظهر أولًا، ولا يُعرض هذا الرقم للزوار.</small>
          </label>
        </div>
      </fieldset>
      <button className="btn" disabled={pending}>
        {pending ? "جارٍ الحفظ…" : submitLabel}
      </button>
    </form>
  );
}
