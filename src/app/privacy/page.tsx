import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "سياسة الخصوصية" };

export default function PrivacyPage() {
  return (
    <InfoPage title="سياسة الخصوصية" draft>
      <p>لا نطلب منك أي بيانات شخصية لتصفّح الموقع.</p>
      <p>المفضلة محفوظة على جهازك فقط حاليًا، ولا تصلنا.</p>
      <p>عند الضغط على زر واتساب سنحسب عدد الضغطات لكل ملف مع التاريخ فقط، بدون أي معلومات عنك.</p>
      <p>لا نبيع بيانات أي شخص ولا نشاركها.</p>
    </InfoPage>
  );
}
