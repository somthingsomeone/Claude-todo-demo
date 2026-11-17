import { notFound } from "next/navigation";
import { ClinicForm } from "@/components/admin/ClinicForm";
import { getDb } from "@/lib/db/client";
import { getAdminClinic } from "@/lib/admin/clinics";
import { setClinicHidden, updateClinicForm } from "../../../actions";

export default async function EditClinic(props: PageProps<"/admin/clinics/[id]">) {
  const clinic = await getAdminClinic(await getDb(), (await props.params).id);
  if (!clinic) notFound();
  const back = `/admin/clinics/${clinic.id}`;
  return (
    <div className="adm-stack">
      <div className="adm-head">
        <h1>{clinic.name}</h1>
      </div>
      {clinic.is_demo ? (
        <p className="flash flash--warn">هذه عيادة تجريبية غير حقيقية ولا يمكن تعديلها.</p>
      ) : (
        <>
          <section className="group group--pad adm-visibility">
            <div>
              <h2 className="section-title">الظهور للزوار</h2>
              <p className="muted">
                {clinic.is_hidden ? "العيادة مخفية عن الزوار." : "العيادة ظاهرة عندما يكون فيها طبيب منشور."} عدد الأطباء المرتبطين بها:{" "}
                {clinic.doctor_count}.
              </p>
            </div>
            <form action={setClinicHidden}>
              <input type="hidden" name="_back" value={back} />
              <input type="hidden" name="id" value={clinic.id} />
              <input type="hidden" name="hidden" value={clinic.is_hidden ? "0" : "1"} />
              <button className={clinic.is_hidden ? "btn" : "btn btn--quiet"}>{clinic.is_hidden ? "إلغاء الإخفاء" : "إخفاء"}</button>
            </form>
          </section>
          <ClinicForm action={updateClinicForm} clinic={clinic} submitLabel="حفظ التعديلات" />
        </>
      )}
    </div>
  );
}
