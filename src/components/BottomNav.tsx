"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/lib/favorites";
import { HeartIcon, HomeIcon, SettingsIcon } from "./Icons";

const ITEMS = [
  { href: "/", label: "الرئيسية", Icon: HomeIcon },
  { href: "/favorites", label: "المفضلة", Icon: HeartIcon },
  { href: "/settings", label: "الإعدادات", Icon: SettingsIcon },
] as const;

function activeIndex(pathname: string) {
  if (pathname.startsWith("/favorites")) return 1;
  if (["/settings", "/about", "/privacy", "/terms", "/corrections"].some((p) => pathname.startsWith(p))) return 2;
  return 0;
}

/**
 * Floating glass tab bar — it hovers above the bottom edge instead of sticking to it.
 * The highlight slides between tabs on a critically damped spring.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { ids } = useFavorites();
  const active = activeIndex(pathname);
  return (
    <nav className="tabbar" aria-label="التنقل الرئيسي" style={{ "--active": active } as React.CSSProperties}>
      <span className="tabbar__indicator" aria-hidden="true" />
      {ITEMS.map(({ href, label, Icon }, i) => (
        <Link
          key={href}
          href={href}
          className={`tabbar__item ${i === active ? "is-active" : ""}`}
          aria-current={i === active ? "page" : undefined}
        >
          <span className="tabbar__icon">
            <Icon size={23} />
            {href === "/favorites" && ids.length > 0 && (
              <span className="tabbar__badge" aria-label={`${ids.length} محفوظ`}>
                {ids.length}
              </span>
            )}
          </span>
          <span className="tabbar__label">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
