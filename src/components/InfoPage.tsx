import Link from "next/link";
import type { ReactNode } from "react";
import { isSiteLive } from "@/lib/site";
import { ArrowIcon } from "./Icons";

/** Simple text page (about, privacy, terms…) with a back button to settings. `bare` skips the text card. */
export function InfoPage({
  title,
  draft,
  bare,
  children,
}: {
  title: string;
  draft?: boolean;
  bare?: boolean;
  children: ReactNode;
}) {
  return (
    <article className="page">
      <div className="page-head page-head--row">
        <Link href="/settings" className="icon-btn" aria-label="رجوع">
          <ArrowIcon size={22} />
        </Link>
        <h1>{title}</h1>
      </div>
      {draft && !isSiteLive() && <p className="tag tag--demo draft-pill">مسودة — بانتظار مراجعة محامٍ سعودي</p>}
      {bare ? children : <div className="group group--text prose">{children}</div>}
    </article>
  );
}
