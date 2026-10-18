import { DoctorForm } from "@/components/admin/DoctorForm";
import { createDoctor } from "../../../actions";

export default function NewDoctor() {
  return (
    <div className="adm-stack">
      <h1>إضافة طبيب</h1>
      <p className="muted">الملف الجديد يبقى مخفي لين تراجعه وتضغط «إظهار للزوار».</p>
      <DoctorForm action={createDoctor} back="/admin/doctors/new" submitLabel="حفظ (مخفي)" />
    </div>
  );
}
