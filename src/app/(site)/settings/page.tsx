import type { Metadata } from "next";
import Link from "next/link";
import { ClearFavorites } from "@/components/ClearFavorites";
import { ChevronIcon, DocIcon, EditIcon, InfoIcon, ShieldIcon, UserIcon } from "@/components/Icons";
import { LogoMark } from "@/components/Logo";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "الإعدادات",
  description: "إعدادات باناكس وروابط الشروط والخصوصية وطلبات التصحيح.",
  path: "/settings",
  noindex: true,
});

const LINKS = [
  { href: "/about", label: "عن باناكس وكيف نتحقق", Icon: InfoIcon, tile: "blue" },
  { href: "/privacy", label: "سياسة الخصوصية", Icon: ShieldIcon, tile: "green" },
  { href: "/terms", label: "الشروط والأحكام", Icon: DocIcon, tile: "gray" },
  { href: "/corrections", label: "طلب تصحيح أو إزالة", Icon: EditIcon, tile: "orange" },
];

export default function SettingsPage() {
  return (
    <section className="page" aria-labelledby="settings-title">
      <div className="page-head">
        <h1 id="settings-title">الإعدادات</h1>
      </div>

      <div className="group account">
        <span className="account__avatar">
          <UserIcon size={28} />
        </span>
        <span className="row__text">
          <b>حسابك</b>
          <small>تسجيل الدخول لحفظ المفضلة على كل أجهزتك — قريبًا</small>
        </span>
      </div>

      <ul className="group list">
        {LINKS.map(({ href, label, Icon, tile }) => (
          <li key={href}>
            <Link href={href} className="row row--link">
              <span className={`row__icon tile tile--${tile}`}>
                <Icon size={18} />
              </span>
              <span className="row__text">{label}</span>
              <ChevronIcon size={18} className="row__chev" />
            </Link>
          </li>
        ))}
      </ul>

      <ul className="group list">
        <li>
          <ClearFavorites />
        </li>
      </ul>

      <div className="settings-foot">
        <LogoMark size={30} />
        <p>باناكس · نسخة تجريبية 0.1</p>
      </div>
    </section>
  );
}
