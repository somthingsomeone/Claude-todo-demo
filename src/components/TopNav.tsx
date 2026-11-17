"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/lib/favorites";
import { activeIndex, isDetailPath, NAV_ITEMS } from "./BottomNav";
import { HeartIcon } from "./Icons";

/** The top bar's end: «ما هو بانيفو؟» and the saved doctors; the three tabs from 64rem up. */
export function TopNav() {
  const pathname = usePathname();
  const { ids } = useFavorites();
  const active = activeIndex(pathname);
  return (
    <div className="topbar__end">
      <nav className="topbar__tabs" aria-label="التنقل الرئيسي">
        {NAV_ITEMS.map(({ href, label }, i) => (
          <Link
            key={href}
            href={href}
            className="topbar__tab"
            aria-current={i === active ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Link href="/intro" className="shelf__more">
        ما هو بانيفو؟
      </Link>
      {/* a doctor's page has its own heart (save this doctor); one heart per screen */}
      {!isDetailPath(pathname) && (
        <Link
          href="/favorites"
          className="round-btn round-btn--flat topbar__fav"
          aria-label={
            ids.length > 0 ? `المحفوظات (${ids.length})` : "المحفوظات"
          }
          aria-current={active === 1 ? "page" : undefined}
        >
          <HeartIcon size={20} />
          {ids.length > 0 && (
            <span className="tabbar__badge" aria-hidden="true">
              {ids.length}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}
