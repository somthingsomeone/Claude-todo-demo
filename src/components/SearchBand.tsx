import Link from "next/link";
import { SPECIALTIES, specialtyPath } from "@/lib/doctors";
import { SearchIcon, SpecialtyIcon } from "./Icons";

/** Brand blue owns this region: the search field and the five specialties. Works without JavaScript. */
export function SearchBand({ title, query = "", tiles = true }: { title?: string; query?: string; tiles?: boolean }) {
  return (
    <section className="band" aria-label="البحث">
      <div className="wrap band__inner">
        {title && <h1 className="band__title">{title}</h1>}
        <form className="search" role="search" action="/search" method="get">
          <label htmlFor="q" className="sr-only">
            ابحث عن طبيب
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="ابحث باسم الطبيب أو العيادة أو الحالة"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="submit" className="search__go" aria-label="ابحث">
            <SearchIcon size={22} />
          </button>
        </form>
        {tiles && (
          <nav aria-label="التخصصات">
            <ul className="tiles">
              {SPECIALTIES.map((s) => (
                <li key={s.slug}>
                  <Link href={specialtyPath(s.slug)} className="tile">
                    <SpecialtyIcon slug={s.slug} size={26} />
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  );
}
