import { DoctorForm } from "@/components/admin/DoctorForm";
import { createDoctorForm } from "../../../actions";

export default function NewDoctor() {
  return (
    <div className="adm-stack">
      <h1>إضافة طبيب</h1>
      <p className="muted">احفظه «مسودة» لين تتأكد من المعلومات وموافقة الطبيب، بعدين غيّره إلى «منشور».</p>
      <DoctorForm action={createDoctorForm} back="/admin/doctors/new" submitLabel="حفظ" />
    </div>
  );
}
