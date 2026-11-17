import type { Db } from "../db/client";
import type { Clinic, Doctor, SpecialtySlug } from "../doctors";
import { isSiteLive } from "../site";

/**
 * Public reads. A profile is shown only when it is published, not hidden, and has a
 * consent date (the database enforces that last part). Demo profiles disappear when
 * SITE_LIVE=true. Private fields (consent, title note, photo permission) never leave here,
 * and ratings are not read at all (not displayed anywhere).
 * Order: the owner's manual position, then name. The order is never described publicly.
 */
export function publicWhere(live = isSiteLive()) {
  return `d.status = 'published' and not d.is_hidden${live ? " and not d.is_demo" : ""}`;
}

function clinicWhere(live = isSiteLive()) {
  return `not c.is_hidden${live ? " and not c.is_demo" : ""}`;
}

const PUBLIC_COLUMNS = `
  d.slug, d.name, d.title, d.specialty, d.role,
  coalesce(c.name, d.hospital) as hospital, case when ${clinicWhere()} then c.slug end as clinic_slug,
  coalesce(c.district, d.district) as district, coalesce(c.map_url, d.map_url) as map_url,
  d.bio, d.treats, d.languages, d.years_experience, d.whatsapp,
  d.source, to_char(d.checked_at, 'YYYY-MM-DD') as checked_at, to_char(d.updated_at, 'YYYY-MM-DD') as updated_at,
  d.is_demo, extract(epoch from p.uploaded_at)::bigint as photo_version`;

const FROM = `from doctors d
  left join clinics c on c.id = d.clinic_id
  left join doctor_photos p on p.doctor_id = d.id`;

const ORDER = `order by d.position nulls last, d.name`;

interface Row {
  slug: string;
  name: string;
  title: string;
  specialty: SpecialtySlug;
  role: string;
  hospital: string;
  clinic_slug: string | null;
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
    clinicSlug: r.clinic_slug,
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

export async function listPublicDoctors(db: Db, opts: { specialty?: SpecialtySlug; clinicSlug?: string } = {}): Promise<Doctor[]> {
  const params: unknown[] = [];
  let extra = "";
  if (opts.specialty) {
    params.push(opts.specialty);
    extra += ` and d.specialty = $${params.length}`;
  }
  if (opts.clinicSlug) {
    params.push(opts.clinicSlug);
    extra += ` and c.slug = $${params.length} and ${clinicWhere()}`;
  }
  const rows = await db.query<Row>(`select ${PUBLIC_COLUMNS} ${FROM} where ${publicWhere()}${extra} ${ORDER}`, params);
  return rows.map(toDoctor);
}

export async function getPublicDoctor(db: Db, slug: string): Promise<Doctor | null> {
  const [row] = await db.query<Row>(`select ${PUBLIC_COLUMNS} ${FROM} where d.slug = $1 and ${publicWhere()}`, [slug]);
  return row ? toDoctor(row) : null;
}

interface ClinicRow {
  slug: string;
  name: string;
  district: string;
  map_url: string | null;
  specialties: SpecialtySlug[];
  doctor_count: number;
  is_demo: boolean;
}

const CLINIC_SELECT = `
  select c.slug, c.name, c.district, c.map_url, c.is_demo,
    array_agg(distinct d.specialty) as specialties, count(d.id)::int as doctor_count
  from clinics c join doctors d on d.clinic_id = c.id and ${publicWhere()}
  where ${clinicWhere()}`;

const toClinic = (r: ClinicRow): Clinic => ({
  slug: r.slug,
  name: r.name,
  district: r.district,
  mapUrl: r.map_url,
  specialties: r.specialties,
  doctorCount: r.doctor_count,
  demo: r.is_demo,
});

/** Clinics that have at least one public doctor, in the owner's order. */
export async function listPublicClinics(db: Db): Promise<Clinic[]> {
  const rows = await db.query<ClinicRow>(`${CLINIC_SELECT} group by c.id order by c.position nulls last, c.name`);
  return rows.map(toClinic);
}

export async function getPublicClinic(db: Db, slug: string): Promise<Clinic | null> {
  const [row] = await db.query<ClinicRow>(`${CLINIC_SELECT} and c.slug = $1 group by c.id`, [slug]);
  return row ? toClinic(row) : null;
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
