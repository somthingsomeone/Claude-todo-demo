import Link from "next/link";
import type { ReactNode } from "react";

/** A titled, horizontally swipeable row of slips. */
export function Shelf({ id, title, more, children }: { id: string; title: string; more?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section className="shelf" aria-labelledby={id}>
      <div className="shelf__head">
        <h2 id={id} className="shelf__title">
          {title}
        </h2>
        {more && (
          <Link href={more.href} className="shelf__more">
            {more.label}
          </Link>
        )}
      </div>
      <div className="shelf__track">
        {children}
      </div>
    </section>
  );
}
