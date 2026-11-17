"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/lib/favorites";
import { HeartIcon, HomeIcon, SettingsIcon } from "./Icons";

const ITEMS = [
  { href: "/", label: "الرئيسية", Icon: HomeIcon },
  { href: "/favorites", label: "المحفوظات", Icon: HeartIcon },
  { href: "/settings", label: "الإعدادات", Icon: SettingsIcon },
] as const;

function activeIndex(pathname: string) {
  if (pathname.startsWith("/favorites")) return 1;
  if (["/settings", "/about", "/privacy", "/terms", "/corrections"].some((p) => pathname.startsWith(p))) return 2;
  return 0;
}

/** A doctor's page (/riyadh/<specialty>/<doctor>) gives the bottom edge to the contact bar instead. */
export function isDetailPath(pathname: string) {
  return /^\/riyadh\/[a-z]+\/[a-z0-9-]+$/.test(pathname) && !pathname.startsWith("/riyadh/clinics/");
}

/** Floating tab bar: it hovers above the bottom edge instead of sticking to it. */
export function BottomNav() {
  const pathname = usePathname();
  const { ids } = useFavorites();
  if (isDetailPath(pathname)) return null;
  const active = activeIndex(pathname);
  return (
    <nav className="tabbar" aria-label="التنقل الرئيسي">
      {ITEMS.map(({ href, label, Icon }, i) => (
        <Link key={href} href={href} className="tabbar__item" aria-current={i === active ? "page" : undefined}>
          <span className="tabbar__icon">
            <Icon size={22} />
            {href === "/favorites" && ids.length > 0 && (
              <span className="tabbar__badge" aria-label={`${ids.length} محفوظ`}>
                {ids.length}
              </span>
            )}
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
