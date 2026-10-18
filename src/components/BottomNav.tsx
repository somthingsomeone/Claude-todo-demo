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

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/doctors");
  return pathname.startsWith(href);
}

/** Floating navigation: hovers above the bottom edge instead of sticking to it. */
export function BottomNav() {
  const pathname = usePathname();
  const { ids } = useFavorites();
  return (
    <nav className="bottom-nav" aria-label="التنقل الرئيسي">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav__item ${active ? "is-active" : ""}`}
            aria-current={active ? "page" : undefined}
            aria-label={label}
          >
            <span className="bottom-nav__icon">
              <Icon size={22} />
              {href === "/favorites" && ids.length > 0 && (
                <span className="bottom-nav__badge" aria-hidden="true">
                  {ids.length}
                </span>
              )}
            </span>
            <span className="bottom-nav__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
