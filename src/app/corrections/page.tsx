import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "طلب تصحيح أو إزالة" };

export default function CorrectionsPage() {
  return (
    <InfoPage title="طلب تصحيح أو إزالة">
      <p>إذا كنت طبيبًا أو تمثّل منشأة وتبي تصحّح معلومة أو تشيل ملفك، تقدر ترسل لنا طلب.</p>
      <p>نموذج الطلب يتفعّل مع ربط قاعدة البيانات قبل الإطلاق.</p>
    </InfoPage>
  );
}
