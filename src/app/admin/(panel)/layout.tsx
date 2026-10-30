import Link from "next/link";
import { Suspense } from "react";
import { Flash } from "@/components/admin/Flash";
import { LogoMark } from "@/components/Logo";
import { ROLE_LABELS } from "@/lib/admin/core";
import { requireAdmin } from "@/lib/admin/session";
import { logout } from "../actions";

export const metadata = { title: "لوحة الإدارة", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireAdmin();
  const links: [string, string][] = [
    ["/admin", "الملخص"],
    ["/admin/doctors", "الأطباء"],
    ["/admin/requests", "طلبات التصحيح"],
    ["/admin/history", "سجل التغييرات"],
  ];
  if (actor.role === "owner") links.push(["/admin/admins", "المشرفون"]);
  return (
    <div className="adm">
      <header className="adm__bar">
        <div className="container adm__bar-inner">
          <Link href="/admin" className="adm__brand">
            <LogoMark size={28} />
            لوحة الإدارة
          </Link>
          <span className="adm__who">
            {actor.displayName} <small>({ROLE_LABELS[actor.role]})</small>
          </span>
          <Link href="/" className="adm__site">
            الموقع
          </Link>
          <form action={logout}>
            <button className="link-btn">خروج</button>
          </form>
        </div>
        <nav className="container adm__nav" aria-label="أقسام الإدارة">
          {links.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container adm__main">
        <Suspense>
          <Flash />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
