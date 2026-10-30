import type { Db } from "../db/client";
import type { Doctor, SpecialtySlug } from "../doctors";
import { isSiteLive } from "../site";

/**
 * Public reads. A profile is shown only when it is published, not hidden, and has a
 * consent date (the database enforces that last part). Demo profiles disappear when
 * SITE_LIVE=true. Private fields (consent, title note, photo permission) never leave here,
 * and ratings are not read at all (not displayed anywhere).
 */
export function publicWhere(live = isSiteLive()) {
  return `d.status = 'published' and not d.is_hidden${live ? " and not d.is_demo" : ""}`;
}

const PUBLIC_COLUMNS = `
  d.slug, d.name, d.title, d.specialty, d.role, d.hospital, d.district, d.map_url, d.bio, d.treats,
  d.languages, d.years_experience, d.whatsapp,
  d.source, to_char(d.checked_at, 'YYYY-MM-DD') as checked_at, to_char(d.updated_at, 'YYYY-MM-DD') as updated_at,
  d.is_demo, extract(epoch from p.uploaded_at)::bigint as photo_version`;

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
  whatsapp: string;
  source: string;
  checked_at: string;
  updated_at: string;
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
    whatsapp: r.whatsapp,
    photo: r.photo_version === null ? null : `/photos/${r.slug}?v=${r.photo_version}`,
    source: r.source,
    checkedAt: r.checked_at,
    updatedAt: r.updated_at,
    demo: r.is_demo,
  };
}

export async function listPublicDoctors(db: Db): Promise<Doctor[]> {
  const rows = await db.query<Row>(
    `select ${PUBLIC_COLUMNS} from doctors d left join doctor_photos p on p.doctor_id = d.id
     where ${publicWhere()}
     order by d.name`, // alphabetical: placement is never sold
  );
  return rows.map(toDoctor);
}

export async function getPublicDoctor(db: Db, slug: string): Promise<Doctor | null> {
  const [row] = await db.query<Row>(
    `select ${PUBLIC_COLUMNS} from doctors d left join doctor_photos p on p.doctor_id = d.id
     where d.slug = $1 and ${publicWhere()}`,
    [slug],
  );
  return row ? toDoctor(row) : null;
}

export async function getPublicPhoto(db: Db, slug: string): Promise<{ mime: string; data: Uint8Array } | null> {
  const [row] = await db.query<{ mime: string; data: Uint8Array }>(
    `select p.mime, p.data from doctor_photos p join doctors d on d.id = p.doctor_id
     where d.slug = $1 and ${publicWhere()}`,
    [slug],
  );
  return row ?? null;
}

/** Adds one WhatsApp click for today (Riyadh time). Stores no visitor data. */
export async function recordWhatsAppClick(db: Db, slug: string): Promise<boolean> {
  const rows = await db.query(
    `insert into whatsapp_clicks (doctor_id, day, clicks)
     select d.id, (now() at time zone 'Asia/Riyadh')::date, 1 from doctors d
     where d.slug = $1 and ${publicWhere()} and d.whatsapp <> ''
     on conflict (doctor_id, day) do update set clicks = whatsapp_clicks.clicks + 1
     returning 1`,
    [slug],
  );
  return rows.length > 0;
}
