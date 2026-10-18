import { SPECIALTIES } from "@/lib/doctors";
import { TITLES, type AdminDoctor } from "@/lib/admin/profiles";

/** Add/edit form for a doctor profile. Every public fact needs a source + checked date. No rating fields: profiles never rate themselves. */
export function DoctorForm({
  action,
  doctor,
  back,
  submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  doctor?: AdminDoctor;
  back: string;
  submitLabel: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="adm-form">
      <input type="hidden" name="_back" value={back} />
      {doctor && <input type="hidden" name="id" value={doctor.id} />}

      <fieldset className="glass card">
        <legend>الأساسيات</legend>
        <div className="grid-2">
          <label className="field">
            <span>الاسم (بدون «د.»)</span>
            <input name="name" required maxLength={80} defaultValue={doctor?.name} />
          </label>
          <label className="field">
            <span>الرابط المختصر</span>
            <input name="slug" required maxLength={80} dir="ltr" defaultValue={doctor?.slug} placeholder="sara-alqahtani" />
            <small>إنجليزي صغير وشرطات فقط. يظهر في رابط الصفحة.</small>
          </label>
          <label className="field">
            <span>التخصص</span>
            <select name="specialty" required defaultValue={doctor?.specialty ?? ""}>
              <option value="" disabled>
                اختر
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
            <select name="title" required defaultValue={doctor?.title ?? "د."}>
              {TITLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <small>العلاج الطبيعي: «أخصائي/أخصائية» إلا لو فيه مستند يثبت لقب «د.».</small>
          </label>
          <label className="field">
            <span>مستند لقب «د.» (للعلاج الطبيعي فقط)</span>
            <input name="title_note" maxLength={200} defaultValue={doctor?.title_note ?? ""} placeholder="مثال: شهادة دكتوراه أرسلتها العيادة" />
          </label>
          <label className="field">
            <span>المسمى</span>
            <input name="role" required maxLength={80} defaultValue={doctor?.role} placeholder="استشارية جلدية" />
          </label>
        </div>
      </fieldset>

      <fieldset className="glass card">
        <legend>المكان والتواصل</legend>
        <div className="grid-2">
          <label className="field">
            <span>المستشفى / العيادة</span>
            <input name="hospital" required maxLength={120} defaultValue={doctor?.hospital} />
          </label>
          <label className="field">
            <span>الحي</span>
            <input name="district" required maxLength={120} defaultValue={doctor?.district} placeholder="حي الملقا، الرياض" />
          </label>
          <label className="field">
            <span>رابط الخريطة (اختياري)</span>
            <input name="map_url" type="url" dir="ltr" defaultValue={doctor?.map_url ?? ""} placeholder="https://maps.app.goo.gl/…" />
          </label>
          <label className="field">
            <span>رقم واتساب العيادة</span>
            <input name="whatsapp" dir="ltr" inputMode="tel" defaultValue={doctor?.whatsapp ? `0${doctor.whatsapp.slice(3)}` : ""} placeholder="05XXXXXXXX" />
          </label>
        </div>
      </fieldset>

      <fieldset className="glass card">
        <legend>عن الطبيب</legend>
        <label className="field">
          <span>نبذة قصيرة</span>
          <textarea name="bio" rows={3} maxLength={800} defaultValue={doctor?.bio} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>يعالج (كل حالة بسطر)</span>
            <textarea name="treats" rows={5} defaultValue={doctor?.treats.join("\n")} />
          </label>
          <label className="field">
            <span>اللغات (افصل بفاصلة)</span>
            <input name="languages" defaultValue={doctor?.languages.join("، ") ?? "العربية"} />
          </label>
          <label className="field">
            <span>سنوات الخبرة</span>
            <input name="years_experience" type="number" min={0} max={70} defaultValue={doctor?.years_experience ?? ""} />
          </label>
        </div>
      </fieldset>

      <fieldset className="glass card">
        <legend>المصدر</legend>
        <div className="grid-2">
          <label className="field">
            <span>مصدر المعلومات</span>
            <input name="source" required maxLength={300} defaultValue={doctor?.source} placeholder="موقع العيادة الرسمي" />
          </label>
          <label className="field">
            <span>تاريخ آخر تحقق</span>
            <input name="checked_at" type="date" required defaultValue={doctor?.checked_at ?? today} />
          </label>
        </div>
      </fieldset>

      <button className="btn-primary">{submitLabel}</button>
    </form>
  );
}
