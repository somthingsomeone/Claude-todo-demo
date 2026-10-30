import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DoctorCard } from "@/components/DoctorCard";
import { ArrowIcon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { getDb } from "@/lib/db/client";
import { listPublicDoctors } from "@/lib/data/doctors";
import type { SpecialtySlug } from "@/lib/doctors";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { SPECIALTY_ORDER, SPECIALTY_PAGES } from "@/lib/specialty-content";

function pageFor(slug: string) {
  return SPECIALTY_ORDER.includes(slug as SpecialtySlug) ? SPECIALTY_PAGES[slug as SpecialtySlug] : null;
}

export function generateStaticParams() {
  return SPECIALTY_ORDER.map((specialty) => ({ specialty }));
}

export async function generateMetadata(props: PageProps<"/riyadh/[specialty]">): Promise<Metadata> {
  const page = pageFor((await props.params).specialty);
  if (!page) return { title: "الصفحة غير موجودة", robots: { index: false, follow: false } };
  return pageMetadata({ title: page.title, description: page.description, path: `/riyadh/${page.slug}` });
}

export default async function SpecialtyLanding(props: PageProps<"/riyadh/[specialty]">) {
  const page = pageFor((await props.params).specialty);
  if (!page) notFound();
  await connection();
  const doctors = (await listPublicDoctors(await getDb())).filter((d) => d.specialty === page.slug);

  return (
    <article className="page">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "الرئيسية", path: "/" },
            { name: page.title, path: `/riyadh/${page.slug}` },
          ]),
          faqJsonLd(page.faqs),
        ]}
      />
      <nav className="breadcrumb" aria-label="مسار الصفحة">
        <Link href="/" className="icon-btn" aria-label="الرئيسية">
          <ArrowIcon size={22} />
        </Link>
        <span className="muted">الرئيسية / {page.title}</span>
      </nav>

      <header className="page-head">
        <h1>{page.title}</h1>
        <p className="lede">{page.intro}</p>
      </header>

      <section aria-labelledby="list-title">
        <div className="section-head">
          <h2 id="list-title">الأطباء</h2>
          <span className="section-head__count">{doctors.length} نتيجة · الترتيب أبجدي</span>
        </div>
        {doctors.length > 0 ? (
          <div className="card-grid">
            {doctors.map((d) => (
              <DoctorCard key={d.slug} doctor={d} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <p className="empty__title">ما فيه ملفات منشورة في هذا التخصص للحين</p>
            <p>نضيف أطباء جدد باستمرار بعد موافقتهم.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="faq-title">
        <h2 id="faq-title" className="section-title">أسئلة شائعة</h2>
        <div className="faq">
          {page.faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="note">معلومات عامة وليست نصيحة طبية. للتشخيص والعلاج راجع طبيبك. في الطوارئ اتصل بـ 997 أو 911.</p>
      </section>
    </article>
  );
}
