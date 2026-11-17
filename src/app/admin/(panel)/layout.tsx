import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Flash } from "@/components/admin/Flash";
import { ROLE_LABELS } from "@/lib/admin/core";
import { requireAdmin } from "@/lib/admin/session";
import { logout } from "../actions";

export const metadata = { title: "لوحة الإدارة", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireAdmin();
  const links: [string, string][] = [
    ["/admin", "الملخص"],
    ["/admin/doctors", "الأطباء"],
    ["/admin/clinics", "العيادات"],
    ["/admin/requests", "طلبات التصحيح"],
    ["/admin/history", "سجل التغييرات"],
  ];
  if (actor.role === "owner") links.push(["/admin/admins", "المشرفون"]);
  return (
    <div className="adm">
      <header className="adm__bar">
        <div className="wrap adm__bar-inner">
          <Link href="/admin" className="adm__brand">
            <img src="/brand/wordmark-header.webp" alt="بانيفو" width={87} height={28} />
            الإدارة
          </Link>
          <span className="adm__who">
            {actor.displayName} ({ROLE_LABELS[actor.role]})
          </span>
          <Link href="/" className="link-btn">
            الموقع
          </Link>
          <form action={logout}>
            <button className="link-btn">تسجيل الخروج</button>
          </form>
        </div>
        <AdminNav links={links} />
      </header>
      <main className="wrap adm__main">
        <Suspense>
          <Flash />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
