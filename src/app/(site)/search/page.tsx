import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { DoctorSlip } from "@/components/DoctorSlip";
import { SearchIcon } from "@/components/Icons";
import { SearchBand } from "@/components/SearchBand";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";
import { filterDoctors } from "@/lib/doctors";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "البحث",
  description: "ابحث في بانيفو باسم الطبيب أو العيادة أو الحالة.",
  path: "/search",
  noindex: true,
});

/** Server-rendered search: works without JavaScript and keeps the query in the address. */
export default async function SearchPage(props: PageProps<"/search">) {
  await connection();
  const raw = (await props.searchParams).q;
  const q = (typeof raw === "string" ? raw : "").slice(0, 80).trim();
  const all = await listPublicDoctors(await getDb());
  const results = q ? filterDoctors(all, { query: q }) : all;

  return (
    <>
      <SearchBand query={q} tiles={false} />
      <div className="wrap page">
        <h1 className="section-title">{q ? `نتائج «${q}»: ${results.length}` : "جميع الأطباء"}</h1>
        {results.length > 0 ? (
          <div className="stack">
            {results.map((d) => (
              <DoctorSlip key={d.slug} doctor={d} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <SearchIcon size={28} className="icon muted" />
            <p className="empty__title">لا توجد نتائج</p>
            <p className="muted">جرّب كلمة أخرى، مثل اسم الحي أو الحالة.</p>
            <Link href="/search" className="btn btn--quiet">
              عرض جميع الأطباء
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
