import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { Placeholder } from "@/components/Placeholder";
import { breadcrumbJsonLd, organizationJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "من نحن وكيف نتحقق",
  description: "من يدير بانيفو، وكيف يُدرج الأطباء ويُتحقق من معلوماتهم، ولماذا لا يُباع الظهور في الدليل.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <InfoPage title="من نحن وكيف نتحقق">
      <JsonLd
        data={[
          organizationJsonLd(),
          breadcrumbJsonLd([
            { name: "الرئيسية", path: "/" },
            { name: "من نحن وكيف نتحقق", path: "/about" },
          ]),
        ]}
      />
      <h2>من نحن</h2>
      <p>
        بانيفو دليل معلومات عن الأطباء وأخصائيي العلاج الطبيعي السعوديين في الرياض، يديره <Placeholder>اسم الجهة</Placeholder>،
        سجل تجاري رقم <Placeholder>رقم السجل التجاري</Placeholder>. للتواصل: <Placeholder>إيميل التواصل</Placeholder>.
      </p>
      <p>
        غايتنا أن تعرف طبيبك قبل موعدك: تخصصه، ومكان عمله، والحالات التي يعالجها، ثم تتواصل مع العيادة مباشرة. بانيفو ليس جهة
        رعاية صحية، ولا يقدّم استشارات طبية، ولا يحجز المواعيد حاليًا.
      </p>

      <h2>كيف يُدرج الأطباء</h2>
      <ul>
        <li>
          لا يُنشر ملف أي طبيب إلا <b>بموافقته</b>، ونسجّل تاريخ الموافقة وطريقتها (واتساب أو بريد إلكتروني أو ورقيًا).
        </li>
        <li>لا نتقاضى أي مقابل مالي لإدراج طبيب أو لإبراز ظهوره، ولا توجد إعلانات مدفوعة للأطباء.</li>
      </ul>

      <h2>كيف نتحقق من المعلومات</h2>
      <ul>
        <li>
          تأتي المعلومات من الطبيب نفسه أو من مصادر نذكرها بجانبها، مع <b>تاريخ آخر تحقق</b> منها.
        </li>
        <li>نكتب المسمّى المهني الدقيق، فلا يُكتب لقب «د.» قبل اسم أخصائي العلاج الطبيعي إلا إذا توفّر مستند يثبته.</li>
        <li>لا ننشر صورة الطبيب إلا بعد موافقته عليها.</li>
        <li>لا نعرض تقييمات أو نجومًا.</li>
        <li>
          إن وجدت معلومة غير دقيقة، أو كنت طبيبًا وتريد تعديل ملفك أو حذفه، فراسلنا بالبريد الإلكتروني كما في صفحة{" "}
          <Link href="/corrections">طلب تصحيح أو إزالة</Link>.
        </li>
      </ul>

      <h2>التواصل مع العيادة</h2>
      <p>
        يفتح زر واتساب محادثة مباشرة بينك وبين العيادة، وبانيفو ليس طرفًا فيها. ولا نحفظ من ذلك إلا عدد الضغطات على الزر لكل ملف
        مع التاريخ، دون أي معلومات عنك.
      </p>

      <p className="updated">
        اقرأ أيضًا: <Link href="/terms">الشروط والأحكام</Link> · <Link href="/privacy">سياسة الخصوصية</Link>
      </p>
    </InfoPage>
  );
}
