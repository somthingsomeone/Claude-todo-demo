import Link from "next/link";
import { specialtyPath } from "@/lib/doctors";
import { SPECIALTY_ORDER, SPECIALTY_PAGES } from "@/lib/specialty-content";

/** Plain links to every important page (helps visitors and search engines find them). */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <img className="site-footer__brand" src="/brand/wordmark-footer.webp" alt="بانيفو" width={74} height={24} loading="lazy" />
        <div className="site-footer__cols">
          <nav aria-labelledby="f-specialties">
            <h2 id="f-specialties">التخصصات في الرياض</h2>
            <ul>
              {SPECIALTY_ORDER.map((slug) => (
                <li key={slug}>
                  <Link href={specialtyPath(slug)}>{SPECIALTY_PAGES[slug].title}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="f-panivo">
            <h2 id="f-panivo">بانيفو</h2>
            <ul>
              <li>
                <Link href="/intro">ما هو بانيفو؟</Link>
              </li>
              <li>
                <Link href="/about">من نحن وكيف نتحقق</Link>
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
        </div>
        <p className="site-footer__note">
          بانيفو دليل معلومات وليس جهة رعاية صحية، ولا يقدّم استشارات طبية. في الحالات الطارئة اتصل بالرقم 997 أو 911.
        </p>
      </div>
    </footer>
  );
}
