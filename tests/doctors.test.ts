import { describe, expect, it } from "vitest";
import { DEMO_DOCTORS } from "@/lib/db/demo-data";
import { SPECIALTIES, filterDoctors, normalizeArabic, whatsappLink, type Doctor } from "@/lib/doctors";

const DOCTORS: Doctor[] = DEMO_DOCTORS.map((d) => ({
  ...d,
  mapUrl: null,
  whatsapp: "",
  photo: null,
  demo: true,
}));

describe("demo data", () => {
  it("has unique demo- slugs and known specialties", () => {
    const slugs = DOCTORS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((s) => s.startsWith("demo-"))).toBe(true);
    const known = new Set(SPECIALTIES.map((s) => s.slug));
    for (const d of DOCTORS) expect(known.has(d.specialty)).toBe(true);
  });

  it("covers the five launch specialties", () => {
    expect(SPECIALTIES.map((s) => s.name)).toEqual(["جلدية", "تجميل وليزر", "عيون", "أسنان", "علاج طبيعي"]);
    for (const s of SPECIALTIES) expect(DOCTORS.some((d) => d.specialty === s.slug)).toBe(true);
  });

  it("never calls a physiotherapist a doctor", () => {
    for (const d of DOCTORS.filter((x) => x.specialty === "physio")) expect(d.title).toMatch(/^أخصائي/);
  });
});

describe("search", () => {
  it("filters by specialty", () => {
    const eyes = filterDoctors(DOCTORS, { specialty: "eyes" });
    expect(eyes.length).toBeGreaterThan(0);
    expect(eyes.every((d) => d.specialty === "eyes")).toBe(true);
  });

  it("matches Arabic spelling variants (أ/ا, ة/ه)", () => {
    expect(normalizeArabic("أسنان")).toBe(normalizeArabic("اسنان"));
    expect(filterDoctors(DOCTORS, { query: "اسنان" }).length).toBe(filterDoctors(DOCTORS, { specialty: "dental" }).length);
    expect(filterDoctors(DOCTORS, { query: "الصدفيه" }).map((d) => d.slug)).toContain("demo-sara-alqahtani");
  });

  it("returns nothing for unknown words", () => {
    expect(filterDoctors(DOCTORS, { query: "zzzz" })).toEqual([]);
  });
});

describe("whatsapp", () => {
  it("builds a prefilled wa.me link only when a number exists", () => {
    const base = DOCTORS[0];
    expect(whatsappLink(base)).toBeNull();
    const link = whatsappLink({ ...base, whatsapp: "966500000000" });
    expect(link).toMatch(/^https:\/\/wa\.me\/966500000000\?text=/);
    expect(decodeURIComponent(link!.split("text=")[1])).toContain("باناكس (Panax)");
  });
});
