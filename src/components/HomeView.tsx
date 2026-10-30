"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type Doctor, SPECIALTIES, type SpecialtySlug, filterDoctors, specialtyName } from "@/lib/doctors";
import { DoctorCard } from "./DoctorCard";
import { GridIcon, SearchIcon, SpecialtyIcon } from "./Icons";

const SPECIALTY_TITLES: Record<SpecialtySlug, string> = {
  dermatology: "أطباء الجلدية في الرياض",
  cosmetic: "أطباء التجميل والليزر في الرياض",
  eyes: "أطباء العيون في الرياض",
  dental: "أطباء الأسنان في الرياض",
  physio: "العلاج الطبيعي في الرياض",
};

function greeting(hour: number) {
  if (hour >= 4 && hour < 12) return "صباح الخير";
  return "مساء الخير";
}

function isSpecialty(value: string | null): value is SpecialtySlug {
  return SPECIALTIES.some((s) => s.slug === value);
}

export function HomeView({ doctors }: { doctors: Doctor[] }) {
  const [specialty, setSpecialty] = useState<SpecialtySlug | null>(null);
  const [query, setQuery] = useState("");
  const [hello, setHello] = useState("أهلًا بك");

  // Read the chosen specialty from the link (e.g. /?specialty=eyes) and greet by time of day.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("specialty");
    if (isSpecialty(fromUrl)) setSpecialty(fromUrl);
    setHello(greeting(new Date().getHours()));
  }, []);

  function choose(next: SpecialtySlug | null) {
    setSpecialty(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("specialty", next);
    else url.searchParams.delete("specialty");
    window.history.replaceState(null, "", url);
  }

  const results = useMemo(() => filterDoctors(doctors, { specialty, query }), [doctors, specialty, query]);

  return (
    <>
      <section className="hero">
        <p className="hero__hello">{hello}</p>
        <h1 className="hero__title">
          اعرف طبيبك <span className="text-gradient">قبل موعدك</span>
        </h1>

        <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="q" className="sr-only">
            ابحث
          </label>
          <SearchIcon size={18} className="search__icon" />
          <input
            id="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="طبيب، مستشفى، أو حالة"
            autoComplete="off"
            enterKeyHint="search"
          />
          {query && (
            <button type="button" className="search__clear" aria-label="مسح البحث" onClick={() => setQuery("")}>
              ×
            </button>
          )}
        </form>
      </section>

      <section aria-labelledby="specialties-title">
        <h2 id="specialties-title" className="sr-only">
          التخصصات
        </h2>
        <div className="chips" role="toolbar" aria-label="اختر التخصص">
          <button
            type="button"
            className={`chip chip--all ${specialty === null ? "is-active" : ""}`}
            aria-pressed={specialty === null}
            onClick={() => choose(null)}
          >
            <GridIcon size={18} />
            الكل
          </button>
          {SPECIALTIES.map((s) => (
            <button
              key={s.slug}
              type="button"
              className={`chip ${specialty === s.slug ? "is-active" : ""}`}
              aria-pressed={specialty === s.slug}
              onClick={() => choose(s.slug)}
            >
              <SpecialtyIcon slug={s.slug} size={18} />
              {s.name}
            </button>
          ))}
        </div>
      </section>

      <section className="results" aria-labelledby="results-title">
        <div className="section-head">
          <h2 id="results-title">{specialty ? specialtyName(specialty) : "كل الأطباء"}</h2>
          <span className="section-head__count">{results.length} نتيجة</span>
        </div>
        {specialty && (
          <p className="section-link">
            <Link href={`/riyadh/${specialty}`} className="text-link">
              كل شي عن {SPECIALTY_TITLES[specialty]} ←
            </Link>
          </p>
        )}

        {results.length > 0 ? (
          <div className="card-grid" aria-live="polite">
            {results.map((d) => (
              <DoctorCard key={d.slug} doctor={d} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <span className="empty__icon">
              <SearchIcon size={28} />
            </span>
            <p className="empty__title">ما لقينا نتائج</p>
            <p>جرّب كلمة ثانية أو اختر تخصص آخر.</p>
          </div>
        )}
      </section>
    </>
  );
}
