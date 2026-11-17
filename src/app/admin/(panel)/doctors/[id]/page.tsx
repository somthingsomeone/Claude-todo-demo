import Link from "next/link";
import { notFound } from "next/navigation";
import { DoctorForm } from "@/components/admin/DoctorForm";
import { getDb } from "@/lib/db/client";
import { STATUS_LABELS, getAdminDoctor } from "@/lib/admin/profiles";
import { clinicOptions } from "@/lib/admin/clinics";
import { doctorPath } from "@/lib/doctors";
import { deleteDoctor, removePhoto, setHidden, updateDoctorForm, uploadPhoto } from "../../../actions";

export default async function EditDoctor(props: PageProps<"/admin/doctors/[id]">) {
  const { id } = await props.params;
  const db = await getDb();
  const [doctor, clinics] = await Promise.all([getAdminDoctor(db, id), clinicOptions(db)]);
  if (!doctor) notFound();
  const back = `/admin/doctors/${doctor.id}`;
  const isPublic = doctor.status === "published" && !doctor.is_hidden;

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <h1>{doctor.name}</h1>
        {isPublic && (
          <Link href={doctorPath(doctor)} className="link" target="_blank">
            عرض في الموقع ↗
          </Link>
        )}
      </div>

      {doctor.is_demo ? (
        <p className="flash flash--warn">هذا ملف تجريبي غير حقيقي ولا يمكن تعديله. أضف ملفات حقيقية، وستختفي الملفات التجريبية تلقائيًا عند الإطلاق.</p>
      ) : (
        <>
          <section className="group group--pad adm-visibility">
            <div>
              <h2 className="section-title">الظهور للزوار</h2>
              <p className="muted">
                الحالة: <b>{STATUS_LABELS[doctor.status]}</b>
                {doctor.is_hidden && " · مخفي مؤقتًا"} —{" "}
                {isPublic
                  ? "الملف ظاهر في الموقع."
                  : doctor.status === "draft"
                    ? "لا يظهر للزوار. غيّر الحالة إلى «منشور» من النموذج أدناه (يتطلب تاريخ الموافقة)."
                    : "مخفي مؤقتًا عن الزوار."}
              </p>
            </div>
            <form action={setHidden}>
              <input type="hidden" name="_back" value={back} />
              <input type="hidden" name="id" value={doctor.id} />
              <input type="hidden" name="hidden" value={doctor.is_hidden ? "0" : "1"} />
              <button className={doctor.is_hidden ? "btn" : "btn btn--quiet"}>
                {doctor.is_hidden ? "إلغاء الإخفاء" : "إخفاء مؤقت"}
              </button>
            </form>
          </section>

          <DoctorForm action={updateDoctorForm} doctor={doctor} clinics={clinics} back={back} submitLabel="حفظ التعديلات" />

          <section className="group group--pad">
            <h2 className="section-title">الصورة</h2>
            {doctor.has_photo ? (
              <div className="adm-photo">
                <img src={`/admin/photo/${doctor.id}`} alt="" />
                <div>
                  <p className="muted">الإذن: {doctor.photo_permission_note}</p>
                  <form action={removePhoto}>
                    <input type="hidden" name="_back" value={back} />
                    <input type="hidden" name="id" value={doctor.id} />
                    <button className="btn btn--quiet">حذف الصورة</button>
                  </form>
                </div>
              </div>
            ) : (
              <p className="muted">لا توجد صورة. يظهر الملف دون صورة حتى تُرفع صورة وافق عليها الطبيب.</p>
            )}
            <form action={uploadPhoto} className="form">
              <input type="hidden" name="_back" value={back} />
              <input type="hidden" name="id" value={doctor.id} />
              <label className="field">
                <span>{doctor.has_photo ? "استبدال الصورة" : "رفع صورة"} (JPG أو PNG أو WEBP، بحد أقصى 1.5 ميجابايت)</span>
                <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required />
              </label>
              <label className="field">
                <span>كيف حصلنا على الإذن؟</span>
                <input name="permission_note" required maxLength={300} placeholder="مثال: وافق كتابيًا عبر واتساب بتاريخ …" />
              </label>
              <label className="check">
                <input type="checkbox" name="permission" required />
                <span>الطبيب وافق على الصورة.</span>
              </label>
              <button className="btn">رفع الصورة</button>
            </form>
          </section>

          <form action={deleteDoctor} className="group form adm-danger">
            <input type="hidden" name="_back" value={back} />
            <input type="hidden" name="id" value={doctor.id} />
            <h2 className="section-title">حذف الملف نهائيًا</h2>
            <p className="muted">يُحذف الملف وصورته وعدّاد ضغطاته. للتأكيد اكتب الاسم: {doctor.name}</p>
            <label className="field">
              <span>الاسم</span>
              <input name="confirm_name" required autoComplete="off" />
            </label>
            <button className="btn-danger">حذف الملف نهائيًا</button>
          </form>
        </>
      )}
    </div>
  );
}
