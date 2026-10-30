import Link from "next/link";
import { SPECIALTY_ORDER, SPECIALTY_PAGES } from "@/lib/specialty-content";

/** Plain links to every important page (helps visitors and search engines find them). */
export function SiteFooter() {
  return (
    <footer className="site-footer container">
      <nav aria-label="التخصصات في الرياض">
        <h2 className="site-footer__title">التخصصات في الرياض</h2>
        <ul>
          {SPECIALTY_ORDER.map((slug) => (
            <li key={slug}>
              <Link href={`/riyadh/${slug}`}>{SPECIALTY_PAGES[slug].title}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="عن باناكس">
        <h2 className="site-footer__title">باناكس</h2>
        <ul>
          <li>
            <Link href="/about">عن باناكس وكيف نتحقق</Link>
          </li>
          <li>
            <Link href="/terms">الشروط والأحكام</Link>
          </li>
          <li>
            <Link href="/privacy">سياسة الخصوصية</Link>
          </li>
          <li>
            <Link href="/corrections">طلب تصحيح أو إزالة</Link>
          </li>
        </ul>
      </nav>
      <p className="site-footer__note">
        باناكس دليل معلومات وليس جهة رعاية صحية، ولا يقدّم نصائح طبية. في الطوارئ اتصل بـ 997 أو 911. الترتيب لا يُباع.
      </p>
    </footer>
  );
}
