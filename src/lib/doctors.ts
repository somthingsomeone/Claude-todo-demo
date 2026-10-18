/**
 * Directory types and helpers shared by the public pages (server and browser).
 * Profiles themselves live in the database (see lib/data/doctors.ts).
 */

export type SpecialtySlug = "dermatology" | "cosmetic" | "eyes" | "dental" | "physio";

export interface Specialty {
  slug: SpecialtySlug;
  name: string;
}

export const SPECIALTIES: Specialty[] = [
  { slug: "dermatology", name: "جلدية" },
  { slug: "cosmetic", name: "تجميل وليزر" },
  { slug: "eyes", name: "عيون" },
  { slug: "dental", name: "أسنان" },
  { slug: "physio", name: "علاج طبيعي" },
];

export interface Doctor {
  slug: string;
  name: string;
  /** "د." for doctors. Physiotherapists are "أخصائي/أخصائية علاج طبيعي" unless a documented title supports "د.". */
  title: string;
  specialty: SpecialtySlug;
  /** e.g. "استشاري جلدية" */
  role: string;
  hospital: string;
  district: string;
  bio: string;
  treats: string[];
  /** Only set when the doctor gave permission to show their photo. */
  photo: string | null;
  languages: string[];
  mapUrl: string | null;
  yearsExperience: number | null;
  /** Out of 5. Null when there is no rating with a source yet. */
  rating: number | null;
  ratingCount: number | null;
  ratingSource: string | null;
  /** International format without "+", e.g. 9665XXXXXXXX. Empty when unknown. */
  whatsapp: string;
  source: string;
  checkedAt: string;
  demo: boolean;
}

export function specialtyName(slug: SpecialtySlug): string {
  return SPECIALTIES.find((s) => s.slug === slug)?.name ?? "";
}

/** "د. سارة القحطاني" for doctors; physiotherapists show the name only (their title is shown on its own). */
export function displayName(d: Doctor): string {
  return d.title === "د." ? `د. ${d.name}` : d.name;
}

const ARABIC_VARIANTS: [RegExp, string][] = [
  [/[أإآ]/g, "ا"],
  [/ة/g, "ه"],
  [/ى/g, "ي"],
  [/[ً-ْـ]/g, ""], // harakat + tatweel
];

export function normalizeArabic(text: string): string {
  let out = text.trim().toLowerCase();
  for (const [re, rep] of ARABIC_VARIANTS) out = out.replace(re, rep);
  return out.replace(/\s+/g, " ");
}

export function filterDoctors(
  doctors: Doctor[],
  { specialty, query }: { specialty?: SpecialtySlug | null; query?: string },
): Doctor[] {
  const q = normalizeArabic(query ?? "");
  return doctors.filter((d) => {
    if (specialty && d.specialty !== specialty) return false;
    if (!q) return true;
    const haystack = normalizeArabic(
      [d.name, d.role, d.hospital, d.district, specialtyName(d.specialty), ...d.treats].join(" "),
    );
    return q.split(" ").every((word) => haystack.includes(word));
  });
}

export const WHATSAPP_MESSAGE = "السلام عليكم، وصلت لكم عن طريق باناكس (Panax) وأبغى أستفسر عن موعد.";

export function whatsappLink(d: Doctor): string | null {
  if (!d.whatsapp) return null;
  return `https://wa.me/${d.whatsapp}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}
