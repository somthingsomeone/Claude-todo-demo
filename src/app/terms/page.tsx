import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "الشروط والأحكام" };

export default function TermsPage() {
  return (
    <InfoPage title="الشروط والأحكام" draft>
      <p>المعلومات في باناكس للتعريف فقط، وليست نصيحة طبية.</p>
      <p>نحرص على دقة المعلومات ونذكر مصدر كل معلومة وتاريخ آخر تحقق، لكن تأكد دائمًا من العيادة مباشرة.</p>
      <p>في حالة الطوارئ اتصل بـ 997 أو توجّه لأقرب طوارئ.</p>
    </InfoPage>
  );
}
