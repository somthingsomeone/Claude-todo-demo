import type { Metadata } from "next";
import Link from "next/link";
import { ClearFavorites } from "@/components/ClearFavorites";
import { ChevronIcon, DocIcon, EditIcon, InfoIcon, ShieldIcon, UserIcon } from "@/components/Icons";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = { title: "الإعدادات" };

const LINKS = [
  { href: "/about", label: "عن باناكس", Icon: InfoIcon },
  { href: "/privacy", label: "سياسة الخصوصية", Icon: ShieldIcon },
  { href: "/terms", label: "الشروط والأحكام", Icon: DocIcon },
  { href: "/corrections", label: "طلب تصحيح أو إزالة معلومات", Icon: EditIcon },
];

export default function SettingsPage() {
  return (
    <section className="page" aria-labelledby="settings-title">
      <div className="page-head">
        <h1 id="settings-title">الإعدادات</h1>
      </div>

      <div className="glass card account-card">
        <span className="account-card__icon">
          <UserIcon size={26} />
        </span>
        <div>
          <p className="account-card__title">حسابك</p>
          <p className="muted">تسجيل الدخول لحفظ المفضلة على كل أجهزتك — قريبًا.</p>
        </div>
      </div>

      <ul className="glass menu">
        {LINKS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link href={href} className="menu__item">
              <span className="menu__icon">
                <Icon size={20} />
              </span>
              {label}
              <ChevronIcon size={18} className="menu__chev" />
            </Link>
          </li>
        ))}
      </ul>

      <ul className="glass menu">
        <li>
          <ClearFavorites />
        </li>
      </ul>

      <div className="settings-foot">
        <LogoMark size={34} />
        <p className="muted">باناكس · نسخة تجريبية 0.1</p>
      </div>
    </section>
  );
}
