import type { Db } from "../db/client";
import type { Doctor, SpecialtySlug } from "../doctors";

/**
 * Public reads. A profile is shown only if it is not hidden AND (it is a demo
 * profile OR its Saudi nationality was verified by an admin).
 * Private fields (nationality note, title note, photo permission note) never leave here.
 */
const PUBLIC_WHERE = `not d.is_hidden and (d.is_demo or d.nationality_status = 'verified')`;

const PUBLIC_COLUMNS = `
  d.slug, d.name, d.title, d.specialty, d.role, d.hospital, d.district, d.map_url, d.bio, d.treats,
  d.languages, d.years_experience, d.rating::float8 as rating, d.rating_count, d.rating_source, d.whatsapp,
  d.source, to_char(d.checked_at, 'YYYY-MM-DD') as checked_at, d.is_demo,
  extract(epoch from p.uploaded_at)::bigint as photo_version`;

interface Row {
  slug: string;
  name: string;
  title: string;
  specialty: SpecialtySlug;
  role: string;
  hospital: string;
  district: string;
  map_url: string | null;
  bio: string;
  treats: string[];
  languages: string[];
  years_experience: number | null;
  rating: number | null;
  rating_count: number | null;
  rating_source: string | null;
  whatsapp: string;
  source: string;
  checked_at: string;
  is_demo: boolean;
  photo_version: number | string | null;
}

function toDoctor(r: Row): Doctor {
  return {
    slug: r.slug,
    name: r.name,
    title: r.title,
    specialty: r.specialty,
    role: r.role,
    hospital: r.hospital,
    district: r.district,
    mapUrl: r.map_url,
    bio: r.bio,
    treats: r.treats,
    languages: r.languages,
    yearsExperience: r.years_experience,
    rating: r.rating === null ? null : Number(r.rating),
    ratingCount: r.rating_count,
    ratingSource: r.rating_source,
    whatsapp: r.whatsapp,
    photo: r.photo_version === null ? null : `/photos/${r.slug}?v=${r.photo_version}`,
    source: r.source,
    checkedAt: r.checked_at,
    demo: r.is_demo,
  };
}

export async function listPublicDoctors(db: Db): Promise<Doctor[]> {
  const rows = await db.query<Row>(
    `select ${PUBLIC_COLUMNS} from doctors d left join doctor_photos p on p.doctor_id = d.id
     where ${PUBLIC_WHERE}
     order by d.is_demo, d.rating desc nulls last, d.name`,
  );
  return rows.map(toDoctor);
}

export async function getPublicDoctor(db: Db, slug: string): Promise<Doctor | null> {
  const [row] = await db.query<Row>(
    `select ${PUBLIC_COLUMNS} from doctors d left join doctor_photos p on p.doctor_id = d.id
     where d.slug = $1 and ${PUBLIC_WHERE}`,
    [slug],
  );
  return row ? toDoctor(row) : null;
}

export async function getPublicPhoto(db: Db, slug: string): Promise<{ mime: string; data: Uint8Array } | null> {
  const [row] = await db.query<{ mime: string; data: Uint8Array }>(
    `select p.mime, p.data from doctor_photos p join doctors d on d.id = p.doctor_id
     where d.slug = $1 and ${PUBLIC_WHERE}`,
    [slug],
  );
  return row ?? null;
}

/** Adds one WhatsApp click for today (Riyadh time). Stores no visitor data. */
export async function recordWhatsAppClick(db: Db, slug: string): Promise<boolean> {
  const rows = await db.query(
    `insert into whatsapp_clicks (doctor_id, day, clicks)
     select d.id, (now() at time zone 'Asia/Riyadh')::date, 1 from doctors d
     where d.slug = $1 and ${PUBLIC_WHERE} and d.whatsapp <> ''
     on conflict (doctor_id, day) do update set clicks = whatsapp_clicks.clicks + 1
     returning 1`,
    [slug],
  );
  return rows.length > 0;
}
