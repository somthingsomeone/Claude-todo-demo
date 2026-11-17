import type { Metadata } from "next";
import Link from "next/link";
import { ClearFavorites } from "@/components/ClearFavorites";
import { ThemePicker } from "@/components/ThemePicker";
import { ChevronIcon, DocIcon, EditIcon, InfoIcon, SearchIcon, ShieldIcon } from "@/components/Icons";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "الإعدادات",
  description: "المظهر، والتعريف ببانيفو، والشروط والخصوصية، وطلب التصحيح.",
  path: "/settings",
  noindex: true,
});

const LINKS = [
  { href: "/intro", label: "ما هو بانيفو؟", Icon: SearchIcon },
  { href: "/about", label: "من نحن وكيف نتحقق", Icon: InfoIcon },
  { href: "/terms", label: "الشروط والأحكام", Icon: DocIcon },
  { href: "/privacy", label: "سياسة الخصوصية", Icon: ShieldIcon },
  { href: "/corrections", label: "طلب تصحيح أو إزالة", Icon: EditIcon },
];

export default function SettingsPage() {
  return (
    <section className="wrap page" aria-labelledby="settings-title">
      <h1 id="settings-title" className="page__title">
        الإعدادات
      </h1>
      <ThemePicker />
      <ul className="group">
        {LINKS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link href={href} className="row row--link">
              <span className="row__icon">
                <Icon size={18} />
              </span>
              <span className="row__text">{label}</span>
              <ChevronIcon size={18} className="row__chev" />
            </Link>
          </li>
        ))}
      </ul>
      <ClearFavorites />
      <p className="updated">لا يحتاج استخدام بانيفو إلى حساب. المحفوظات تبقى على جهازك فقط.</p>
    </section>
  );
}
