import { ClinicForm } from "@/components/admin/ClinicForm";
import { createClinicForm } from "../../../actions";

export default function NewClinic() {
  return (
    <div className="adm-stack">
      <h1>إضافة عيادة</h1>
      <ClinicForm action={createClinicForm} submitLabel="حفظ" />
    </div>
  );
}
