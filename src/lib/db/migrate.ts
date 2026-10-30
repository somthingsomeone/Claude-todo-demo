import type { Db } from "./client";
import { DEMO_DOCTORS } from "./demo-data";

/**
 * Database tables. Each entry runs once, in order, and is remembered in _migrations.
 * Never edit an entry that already ran on the real database — add a new one instead.
 */
const MIGRATIONS: [name: string, sql: string][] = [
  [
    "0001_phase1",
    /* sql */ `
    create table admin_users (
      id uuid primary key default gen_random_uuid(),
      email text not null unique check (email = lower(email)),
      display_name text not null,
      role text not null check (role in ('owner', 'editor')),
      is_active boolean not null default true,
      auth_user_id uuid,
      created_at timestamptz not null default now()
    );

    create table doctors (
      id uuid primary key default gen_random_uuid(),
      slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
      name text not null,
      title text not null check (title in ('د.', 'أخصائي علاج طبيعي', 'أخصائية علاج طبيعي')),
      title_note text,
      specialty text not null check (specialty in ('dermatology', 'cosmetic', 'eyes', 'dental', 'physio')),
      role text not null,
      hospital text not null,
      district text not null,
      map_url text,
      bio text not null default '',
      treats text[] not null default '{}',
      languages text[] not null default '{}',
      years_experience int check (years_experience between 0 and 70),
      rating numeric(2, 1) check (rating between 0 and 5),
      rating_count int check (rating_count >= 0),
      rating_source text,
      whatsapp text not null default '' check (whatsapp = '' or whatsapp ~ '^9665[0-9]{8}$'),
      -- Nationality: a status + short source note only. Never ID numbers or documents.
      nationality_status text not null default 'unverified' check (nationality_status in ('unverified', 'verified')),
      nationality_note text,
      source text not null,
      checked_at date not null,
      is_demo boolean not null default false,
      is_hidden boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint name_without_honorific check (name !~ '^\\s*(د\\.|د\\s|دكتور)'),
      constraint nationality_note_no_id_numbers check (nationality_note is null or nationality_note !~ '[0-9٠-٩]{10}'),
      constraint nationality_verified_needs_note check (nationality_status <> 'verified' or coalesce(trim(nationality_note), '') <> ''),
      constraint doctor_title_matches_specialty check (specialty = 'physio' or title = 'د.'),
      constraint physio_doctor_title_needs_proof check (specialty <> 'physio' or title <> 'د.' or coalesce(trim(title_note), '') <> ''),
      constraint rating_needs_source check (rating is null or coalesce(trim(rating_source), '') <> '')
    );

    -- Photos are stored only with the doctor's permission (note required).
    create table doctor_photos (
      doctor_id uuid primary key references doctors (id) on delete cascade,
      mime text not null check (mime in ('image/jpeg', 'image/png', 'image/webp')),
      data bytea not null,
      permission_note text not null check (trim(permission_note) <> ''),
      uploaded_at timestamptz not null default now()
    );

    -- WhatsApp button clicks: a count per profile per day. Nothing about the visitor.
    create table whatsapp_clicks (
      doctor_id uuid not null references doctors (id) on delete cascade,
      day date not null,
      clicks int not null default 0,
      primary key (doctor_id, day)
    );

    -- Correction/removal requests keep only: name, email, relationship, profile, message.
    create table correction_requests (
      id uuid primary key default gen_random_uuid(),
      doctor_id uuid references doctors (id) on delete set null,
      profile_label text not null,
      requester_name text,
      requester_email text,
      relationship text check (relationship in ('self', 'representative', 'patient', 'other')),
      message text,
      consent_at timestamptz,
      status text not null default 'open' check (status in ('open', 'closed')),
      created_at timestamptz not null default now(),
      closed_at timestamptz,
      erased_at timestamptz
    );

    create table audit_log (
      id bigserial primary key,
      admin_id uuid references admin_users (id) on delete set null,
      action text not null,
      entity_table text not null,
      entity_id text not null,
      before_data jsonb,
      after_data jsonb,
      created_at timestamptz not null default now()
    );

    create index whatsapp_clicks_day on whatsapp_clicks (day);
    create index correction_requests_status on correction_requests (status, created_at);
  `,
  ],
  [
    "0002_security",
    /* sql */ `
    -- Row Level Security with NO public policies: on Supabase the public API key
    -- cannot read or write anything. Only the website's server code (private
    -- DATABASE_URL) talks to the database.
    do $$
    declare t text;
    begin
      for t in select tablename from pg_tables where schemaname = 'public' and tablename <> '_migrations'
      loop
        execute format('alter table public.%I enable row level security', t);
      end loop;
    end $$;
  `,
  ],
  [
    "0003_drop_nationality_check",
    /* sql */ `
    -- The owner decided not to verify nationality: no nationality data is kept at all.
    alter table doctors drop constraint if exists nationality_note_no_id_numbers;
    alter table doctors drop constraint if exists nationality_verified_needs_note;
    alter table doctors drop column if exists nationality_status;
    alter table doctors drop column if exists nationality_note;
  `,
  ],
  [
    "0004_status_consent_claims_ratelimit",
    /* sql */ `
    -- Publication status: a profile is public only when published (and not temporarily hidden).
    alter table doctors add column status text not null default 'draft' check (status in ('draft', 'published'));

    -- The doctor's consent to be listed.
    alter table doctors add column consent_date date;
    alter table doctors add column consent_method text check (consent_method in ('whatsapp', 'email', 'paper'));
    alter table doctors add column consent_note text;
    alter table doctors add constraint consent_method_with_date
      check (consent_date is null or consent_method is not null);
    -- Existing rows: demo profiles stay public; real ones go to draft until their consent is recorded.
    update doctors set status = 'published' where is_demo;
    alter table doctors add constraint published_needs_consent
      check (status <> 'published' or is_demo or consent_date is not null);

    -- Ready for "claim profile" later (NOT built yet): a doctor's own login linked to their profile.
    alter table doctors add column claimed_by_auth_user uuid;
    alter table doctors add column claimed_at timestamptz;
    create table profile_claims (
      id uuid primary key default gen_random_uuid(),
      doctor_id uuid not null references doctors (id) on delete cascade,
      auth_user_id uuid not null,
      email text not null check (email = lower(email)),
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
      created_at timestamptz not null default now(),
      decided_at timestamptz,
      decided_by uuid references admin_users (id) on delete set null
    );
    create index profile_claims_doctor on profile_claims (doctor_id);

    -- Abuse protection for the correction form and click counter. "key" is a keyed hash of the
    -- visitor's IP (the IP itself is never stored); rows are deleted after a day.
    create table rate_limits (
      bucket text not null,
      key text not null,
      window_start timestamptz not null,
      hits int not null default 0,
      primary key (bucket, key, window_start)
    );

    -- Row Level Security on every table (including the new ones), with no public policies.
    do $$
    declare t text;
    begin
      for t in select tablename from pg_tables where schemaname = 'public' and tablename <> '_migrations'
      loop
        execute format('alter table public.%I enable row level security', t);
      end loop;
    end $$;

    -- On Supabase, also take away all table rights from the public API roles.
    do $$
    begin
      if exists (select 1 from pg_roles where rolname = 'anon') then
        execute 'revoke all on all tables in schema public from anon, authenticated';
        execute 'revoke all on all sequences in schema public from anon, authenticated';
        execute 'alter default privileges in schema public revoke all on tables from anon, authenticated';
      end if;
    end $$;
  `,
  ],
];

export async function migrate(db: Db) {
  await db.exec(`create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await db.query<{ name: string }>(`select name from _migrations`)).map((r) => r.name));
  for (const [name, sqlText] of MIGRATIONS) {
    if (done.has(name)) continue;
    await db.exec(`begin;\n${sqlText}\ninsert into _migrations (name) values ('${name}');\ncommit;`);
  }
}

/** Adds the fictional demo profiles when there are no doctors at all. */
export async function seedDemoIfEmpty(db: Db) {
  const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from doctors`);
  if (n > 0) return;
  for (const d of DEMO_DOCTORS) {
    await db.query(
      `insert into doctors (slug, name, title, specialty, role, hospital, district, bio, treats, languages,
         years_experience, rating, rating_count, rating_source, source, checked_at, is_demo, status)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, 'published')`,
      [
        d.slug, d.name, d.title, d.specialty, d.role, d.hospital, d.district, d.bio, d.treats, d.languages,
        d.yearsExperience, d.rating, d.ratingCount, d.ratingSource, d.source, d.checkedAt,
      ],
    );
  }
}
