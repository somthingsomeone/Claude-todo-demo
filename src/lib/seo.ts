import type { Metadata } from "next";
import { type Doctor, displayName, specialtyName } from "./doctors";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_NAME_EN } from "./site";
import { SPECIALTY_PAGES, type Faq } from "./specialty-content";

export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "باناكس — اعرف طبيبك قبل موعدك" };

/** Per-page metadata: unique title + description, canonical URL and Open Graph tags. */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path: string;
  /** Always keep out of search results (personal/utility pages). */
  noindex?: boolean;
  absoluteTitle?: boolean;
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ar_SA",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/* ---------------------------------------------------------------- JSON-LD */

export type JsonLdObject = Record<string, unknown>;

/** Safe to drop inside <script type="application/ld+json"> (no "</script>" breakouts). */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function organizationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    alternateName: SITE_NAME_EN,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo.png"),
    description: SITE_DESCRIPTION,
    areaServed: { "@type": "City", name: "الرياض" },
  };
}

/**
 * A doctor → schema.org Physician; a physiotherapist → MedicalBusiness with the
 * Physiotherapy specialty (they are not physicians). Never includes ratings.
 */
export function doctorJsonLd(d: Doctor): JsonLdObject {
  const isPhysio = d.specialty === "physio";
  return {
    "@context": "https://schema.org",
    "@type": isPhysio ? "MedicalBusiness" : "Physician",
    "@id": absoluteUrl(`/doctors/${d.slug}#profile`),
    name: displayName(d),
    url: absoluteUrl(`/doctors/${d.slug}`),
    description: d.bio || `${d.role} — ${d.hospital}`,
    medicalSpecialty: `https://schema.org/${SPECIALTY_PAGES[d.specialty].schemaSpecialty}`,
    ...(d.photo ? { image: absoluteUrl(d.photo) } : {}),
    knowsLanguage: d.languages,
    address: {
      "@type": "PostalAddress",
      streetAddress: d.district,
      addressLocality: "الرياض",
      addressCountry: "SA",
    },
    parentOrganization: { "@type": "MedicalClinic", name: d.hospital },
    areaServed: { "@type": "City", name: "الرياض" },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function faqJsonLd(faqs: Faq[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function doctorBreadcrumb(d: Doctor) {
  return breadcrumbJsonLd([
    { name: "الرئيسية", path: "/" },
    { name: SPECIALTY_PAGES[d.specialty].title, path: `/riyadh/${d.specialty}` },
    { name: displayName(d), path: `/doctors/${d.slug}` },
  ]);
}

export function doctorDescription(d: Doctor): string {
  const treats = d.treats.slice(0, 3).join("، ");
  return `${displayName(d)}، ${d.role} في ${d.hospital} (${d.district}). ${specialtyName(d.specialty)}${
    treats ? `: ${treats}` : ""
  }. تواصل مع العيادة مباشرة عبر واتساب.`.slice(0, 300);
}
