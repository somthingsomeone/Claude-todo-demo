import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon } from "./Icons";

/** Simple text page (about, privacy, terms…) with a back button to settings. */
export function InfoPage({ title, draft, children }: { title: string; draft?: boolean; children: ReactNode }) {
  return (
    <article className="page">
      <div className="page-head page-head--row">
        <Link href="/settings" className="icon-btn" aria-label="رجوع">
          <ArrowIcon size={22} />
        </Link>
        <h1>{title}</h1>
      </div>
      {draft && <p className="pill pill--demo draft-pill">مسودة — بانتظار مراجعة محامٍ سعودي</p>}
      <div className="glass card prose">{children}</div>
    </article>
  );
}
