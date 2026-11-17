import Link from "next/link";
import type { ReactNode } from "react";
import { isSiteLive } from "@/lib/site";
import { ChevronIcon } from "./Icons";

/** Text page (about, privacy, terms…) with a breadcrumb. `bare` skips the text card. */
export function InfoPage({ title, draft, bare, children }: { title: string; draft?: boolean; bare?: boolean; children: ReactNode }) {
  return (
    <article className="wrap page">
      <nav className="crumbs" aria-label="مسار الصفحة">
        <Link href="/">الرئيسية</Link>
        <ChevronIcon size={14} />
        <span aria-current="page">{title}</span>
      </nav>
      <h1 className="page__title">{title}</h1>
      {draft && !isSiteLive() && <p className="label draft-note">مسودة بانتظار مراجعة محامٍ سعودي</p>}
      {bare ? children : <div className="group prose">{children}</div>}
    </article>
  );
}
