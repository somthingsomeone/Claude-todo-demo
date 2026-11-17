import { DoctorForm } from "@/components/admin/DoctorForm";
import { getDb } from "@/lib/db/client";
import { clinicOptions } from "@/lib/admin/clinics";
import { createDoctorForm } from "../../../actions";

export default async function NewDoctor() {
  const clinics = await clinicOptions(await getDb());
  return (
    <div className="adm-stack">
      <h1>إضافة طبيب</h1>
      <p className="muted">احفظ الملف «مسودة» حتى تتأكد من المعلومات وموافقة الطبيب، ثم غيّر حالته إلى «منشور».</p>
      <DoctorForm action={createDoctorForm} clinics={clinics} back="/admin/doctors/new" submitLabel="حفظ" />
    </div>
  );
}
