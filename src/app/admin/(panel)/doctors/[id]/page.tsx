import Link from "next/link";
import { notFound } from "next/navigation";
import { DoctorForm } from "@/components/admin/DoctorForm";
import { getDb } from "@/lib/db/client";
import { getAdminDoctor } from "@/lib/admin/profiles";
import { deleteDoctor, removePhoto, setHidden, updateDoctor, uploadPhoto } from "../../../actions";

export default async function EditDoctor(props: PageProps<"/admin/doctors/[id]">) {
  const { id } = await props.params;
  const doctor = await getAdminDoctor(await getDb(), id);
  if (!doctor) notFound();
  const back = `/admin/doctors/${doctor.id}`;
  const isPublic = !doctor.is_hidden;

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <h1>{doctor.name}</h1>
        {isPublic && (
          <Link href={`/doctors/${doctor.slug}`} className="text-link" target="_blank">
            عرض في الموقع ↗
          </Link>
        )}
      </div>

      {doctor.is_demo ? (
        <p className="flash flash--warn">هذا ملف تجريبي وهمي — ما يتعدّل. أضف ملفات حقيقية واحذف التجريبية قبل الإطلاق.</p>
      ) : (
        <>
          <section className="glass card adm-visibility">
            <div>
              <h2 className="card__title">الظهور للزوار</h2>
              <p className="muted">
                {isPublic ? "الملف ظاهر في الموقع." : "مخفي — راجع المعلومات ثم أظهره."}
              </p>
            </div>
            <form action={setHidden}>
              <input type="hidden" name="_back" value={back} />
              <input type="hidden" name="id" value={doctor.id} />
              <input type="hidden" name="hidden" value={doctor.is_hidden ? "0" : "1"} />
              <button className={doctor.is_hidden ? "btn-primary" : "btn-secondary"}>
                {doctor.is_hidden ? "إظهار للزوار" : "إخفاء"}
              </button>
            </form>
          </section>

          <DoctorForm action={updateDoctor} doctor={doctor} back={back} submitLabel="حفظ التعديلات" />

          <section className="glass card">
            <h2 className="card__title">الصورة</h2>
            {doctor.has_photo ? (
              <div className="adm-photo">
                <img src={`/admin/photo/${doctor.id}`} alt="" />
                <div>
                  <p className="muted">الإذن: {doctor.photo_permission_note}</p>
                  <form action={removePhoto}>
                    <input type="hidden" name="_back" value={back} />
                    <input type="hidden" name="id" value={doctor.id} />
                    <button className="btn-secondary">حذف الصورة</button>
                  </form>
                </div>
              </div>
            ) : (
              <p className="muted">ما فيه صورة. يظهر أول حرف من الاسم بدالها.</p>
            )}
            <form action={uploadPhoto} className="form">
              <input type="hidden" name="_back" value={back} />
              <input type="hidden" name="id" value={doctor.id} />
              <label className="field">
                <span>{doctor.has_photo ? "استبدال الصورة" : "رفع صورة"} (JPG / PNG / WEBP — حتى 1.5 ميجا)</span>
                <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required />
              </label>
              <label className="field">
                <span>كيف أخذنا الإذن؟</span>
                <input name="permission_note" required maxLength={300} placeholder="وافق كتابيًا عبر واتساب بتاريخ …" />
              </label>
              <label className="check">
                <input type="checkbox" name="permission" required />
                <span>أؤكد أن الطبيب أعطى إذنه لنشر هذه الصورة.</span>
              </label>
              <button className="btn-primary">رفع الصورة</button>
            </form>
          </section>

          <form action={deleteDoctor} className="glass card form adm-danger">
            <input type="hidden" name="_back" value={back} />
            <input type="hidden" name="id" value={doctor.id} />
            <h2 className="card__title">حذف الملف نهائيًا</h2>
            <p className="muted">يُحذف الملف وصورته وعدّاد ضغطاته. للتأكيد اكتب الاسم: {doctor.name}</p>
            <label className="field">
              <span>الاسم</span>
              <input name="confirm_name" required autoComplete="off" />
            </label>
            <button className="btn-danger">حذف نهائي</button>
          </form>
        </>
      )}
    </div>
  );
}
