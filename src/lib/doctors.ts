/**
 * Phase 1 directory data.
 *
 * Everything below is FICTIONAL demo data (marked `demo: true`) so we can see the
 * design. Real profiles will come from the admin page + database later, and each
 * real fact must keep its source and last-checked date.
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
  /** "د." for doctors. Physiotherapists are "أخصائي/أخصائية علاج طبيعي", never "دكتور". */
  title: string;
  specialty: SpecialtySlug;
  /** e.g. "استشاري جلدية" */
  role: string;
  hospital: string;
  district: string;
  bio: string;
  treats: string[];
  /** Only set when the doctor gave written permission to show their photo. */
  photo?: string;
  languages: string[];
  yearsExperience: number;
  /** Out of 5. */
  rating: number;
  ratingCount: number;
  /** International format without "+", e.g. 9665XXXXXXXX. Empty for demo profiles. */
  whatsapp: string;
  source: string;
  checkedAt: string;
  demo: boolean;
}

const DEMO_SOURCE = "بيانات تجريبية للعرض فقط";
const DEMO_CHECKED = "2026-10-18";

export const DOCTORS: Doctor[] = [
  {
    slug: "demo-sara-alqahtani",
    name: "سارة القحطاني",
    title: "د.",
    specialty: "dermatology",
    role: "استشارية جلدية",
    hospital: "مجمع الروابي الطبي",
    district: "حي الملقا، الرياض",
    bio: "استشارية أمراض جلدية بخبرة في علاج حب الشباب والأكزيما ومشاكل الشعر والأظافر. تهتم بشرح خطة العلاج للمريض خطوة بخطوة.",
    treats: ["حب الشباب وآثاره", "الأكزيما", "الصدفية", "تساقط الشعر", "فطريات الأظافر"],
    languages: ["العربية", "الإنجليزية"],
    yearsExperience: 14,
    rating: 4.8,
    ratingCount: 212,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-faisal-alotaibi",
    name: "فيصل العتيبي",
    title: "د.",
    specialty: "dermatology",
    role: "أخصائي جلدية",
    hospital: "عيادات النخبة",
    district: "حي الياسمين، الرياض",
    bio: "أخصائي جلدية يركّز على أمراض الجلد الشائعة عند الشباب، والتصبغات، وحساسية الجلد.",
    treats: ["التصبغات والكلف", "حساسية الجلد", "الثآليل", "قشرة الرأس"],
    languages: ["العربية", "الإنجليزية"],
    yearsExperience: 8,
    rating: 4.6,
    ratingCount: 97,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-noura-alshehri",
    name: "نورة الشهري",
    title: "د.",
    specialty: "dermatology",
    role: "استشارية جلدية أطفال",
    hospital: "مركز الندى الطبي",
    district: "حي النرجس، الرياض",
    bio: "متخصصة في أمراض الجلد عند الأطفال والرضّع، وتتابع الحالات المزمنة مع الأهل بشكل دوري.",
    treats: ["أكزيما الأطفال", "الوحمات", "الطفح الجلدي", "الثعلبة"],
    languages: ["العربية"],
    yearsExperience: 11,
    rating: 4.9,
    ratingCount: 143,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-reem-aldosari",
    name: "ريم الدوسري",
    title: "د.",
    specialty: "cosmetic",
    role: "أخصائية تجميل وليزر",
    hospital: "عيادات لمسة الجمال",
    district: "حي الورود، الرياض",
    bio: "أخصائية في الإجراءات التجميلية غير الجراحية وجلسات الليزر، مع تركيز على النتائج الطبيعية وسلامة البشرة.",
    treats: ["إزالة الشعر بالليزر", "البوتوكس", "الفيلر", "تقشير البشرة", "آثار حب الشباب"],
    languages: ["العربية", "الإنجليزية"],
    yearsExperience: 9,
    rating: 4.7,
    ratingCount: 318,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-majed-alharbi",
    name: "ماجد الحربي",
    title: "د.",
    specialty: "cosmetic",
    role: "استشاري جلدية وتجميل",
    hospital: "مجمع روافد الطبي",
    district: "حي العليا، الرياض",
    bio: "استشاري جلدية وتجميل، يقدّم جلسات الليزر وعلاج الندبات وشد البشرة بأحدث الأجهزة.",
    treats: ["الندبات", "شد البشرة", "التصبغات", "الهالات السوداء"],
    languages: ["العربية", "الإنجليزية"],
    yearsExperience: 16,
    rating: 4.5,
    ratingCount: 176,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-abdullah-alshammari",
    name: "عبدالله الشمري",
    title: "د.",
    specialty: "eyes",
    role: "استشاري طب وجراحة العيون",
    hospital: "مستشفى الرؤية التخصصي",
    district: "حي السليمانية، الرياض",
    bio: "استشاري عيون بخبرة في جراحات تصحيح النظر والمياه البيضاء، ويهتم بالفحص الشامل قبل أي إجراء.",
    treats: ["تصحيح النظر (ليزك)", "المياه البيضاء", "جفاف العين", "الجلوكوما"],
    languages: ["العربية", "الإنجليزية"],
    yearsExperience: 18,
    rating: 4.8,
    ratingCount: 264,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-hind-almutairi",
    name: "هند المطيري",
    title: "د.",
    specialty: "eyes",
    role: "أخصائية عيون أطفال",
    hospital: "مركز البصيرة للعيون",
    district: "حي الربيع، الرياض",
    bio: "أخصائية في عيون الأطفال وكسل العين والحَوَل، وتحرص على أن تكون الزيارة مريحة للطفل.",
    treats: ["كسل العين", "الحَوَل", "ضعف النظر عند الأطفال", "حساسية العين"],
    languages: ["العربية"],
    yearsExperience: 7,
    rating: 4.7,
    ratingCount: 88,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-khaled-alzahrani",
    name: "خالد الزهراني",
    title: "د.",
    specialty: "dental",
    role: "استشاري تقويم الأسنان",
    hospital: "عيادات ابتسامة الرياض",
    district: "حي الصحافة، الرياض",
    bio: "استشاري تقويم أسنان للكبار والصغار، يستخدم التقويم الشفاف والتقليدي حسب حالة كل مريض.",
    treats: ["التقويم الشفاف", "التقويم التقليدي", "ازدحام الأسنان", "مشاكل الإطباق"],
    languages: ["العربية", "الإنجليزية"],
    yearsExperience: 13,
    rating: 4.9,
    ratingCount: 401,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-lama-alghamdi",
    name: "لمى الغامدي",
    title: "د.",
    specialty: "dental",
    role: "أخصائية تجميل الأسنان",
    hospital: "مجمع الروابي الطبي",
    district: "حي الملقا، الرياض",
    bio: "أخصائية في تجميل الأسنان والعدسات والتبييض، وتشرح الخيارات والتكلفة قبل البدء.",
    treats: ["تبييض الأسنان", "العدسات التجميلية", "الحشوات التجميلية", "ابتسامة هوليود"],
    languages: ["العربية", "الإنجليزية"],
    yearsExperience: 6,
    rating: 4.6,
    ratingCount: 157,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-turki-alanazi",
    name: "تركي العنزي",
    title: "د.",
    specialty: "dental",
    role: "استشاري علاج العصب",
    hospital: "مركز الندى الطبي",
    district: "حي النرجس، الرياض",
    bio: "متخصص في علاج العصب وإنقاذ الأسنان المتضررة، مع اهتمام بتقليل الألم أثناء العلاج.",
    treats: ["علاج العصب", "ألم الأسنان", "خراج الأسنان", "إعادة علاج العصب"],
    languages: ["العربية"],
    yearsExperience: 12,
    rating: 4.7,
    ratingCount: 129,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-mohammed-alqarni",
    name: "محمد القرني",
    title: "أخصائي علاج طبيعي",
    specialty: "physio",
    role: "أخصائي علاج طبيعي",
    hospital: "مركز حركة للعلاج الطبيعي",
    district: "حي الياسمين، الرياض",
    bio: "أخصائي علاج طبيعي في إصابات الملاعب وآلام الظهر والرقبة، ويضع برنامج تمارين منزلي لكل مريض.",
    treats: ["آلام الظهر والرقبة", "إصابات الملاعب", "تأهيل بعد العمليات", "الانزلاق الغضروفي"],
    languages: ["العربية", "الإنجليزية"],
    yearsExperience: 10,
    rating: 4.8,
    ratingCount: 186,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
  {
    slug: "demo-asma-alsubaie",
    name: "أسماء السبيعي",
    title: "أخصائية علاج طبيعي",
    specialty: "physio",
    role: "أخصائية علاج طبيعي",
    hospital: "مركز حركة للعلاج الطبيعي",
    district: "حي الياسمين، الرياض",
    bio: "أخصائية علاج طبيعي للنساء، تهتم بتأهيل ما بعد الولادة وآلام المفاصل وتحسين الحركة اليومية.",
    treats: ["تأهيل ما بعد الولادة", "آلام الركبة", "خشونة المفاصل", "تحسين القوام"],
    languages: ["العربية"],
    yearsExperience: 7,
    rating: 4.9,
    ratingCount: 104,
    whatsapp: "",
    source: DEMO_SOURCE,
    checkedAt: DEMO_CHECKED,
    demo: true,
  },
];

export function getDoctor(slug: string): Doctor | undefined {
  return DOCTORS.find((d) => d.slug === slug);
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
