import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "عن باناكس" };

export default function AboutPage() {
  return (
    <InfoPage title="عن باناكس">
      <p>
        باناكس دليل بسيط يساعدك تلقى أطباء وأخصائيين سعوديين في الرياض، وتعرف عنهم قبل موعدك: التخصص، المستشفى، نبذة،
        والحالات اللي يعالجونها.
      </p>
      <p>نبدأ بخمسة تخصصات: الجلدية، التجميل والليزر، العيون، الأسنان، والعلاج الطبيعي.</p>
      <p>ترتيب الأطباء في باناكس لا يُباع، ولا توجد إعلانات مدفوعة للأطباء.</p>
    </InfoPage>
  );
}
