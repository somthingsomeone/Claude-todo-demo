# PANIVO (بانيفو) — rules for Claude Code

The owner is a **complete beginner** (no programming, Git, terminal, database or deployment knowledge).

## How to work with the owner

- Reply in simple **Gulf Arabic**. Short messages; explain each step in plain words after doing it.
- **Site copy is consistent Modern Standard Arabic (فصحى)** — never mix colloquial words into it.
- Do the work yourself (files, builds, tests, fixes). Don't hand him code to paste.
- Explain any manual step click by click.
- **Ask before deleting any data** (database rows, columns, tables, uploaded files). Hiding is fine; deleting needs a yes.
- Ask only when a decision is truly his; otherwise pick the sensible option and say so.
- **Do not launch** (do not set `SITE_LIVE=true`, do not point a domain) until the owner says so.

## What PANIVO is

Brand: **PANIVO**, Arabic **بانيفو** (renamed from Panax / باناكس on 2026-11-17; trademark check with SAIP still needed).
Logo: the owner's P mark + lowercase geometric "panivo" wordmark, as supplied artwork in `public/brand/` (black backgrounds made transparent). Never recolour, stretch or shadow it.

Arabic-first (RTL) directory of Saudi doctors and physiotherapists in **Riyadh**, for patients of any nationality. Product truth lives in `PRODUCT.md`. Specialties:
جلدية، تجميل وليزر، عيون، أسنان، علاج طبيعي. Phase 1 = directory + WhatsApp button only. No booking, no payment.

## Hard rules

- **All user-facing text is Arabic, RTL** (`lang="ar" dir="rtl"`).
- **No fake data presented as real.** Demo profiles are fictional, start with `demo-`, show «تجريبي», and are hidden when `SITE_LIVE=true`.
- **No star ratings, rating numbers or review counts** anywhere public (pages, cards, JSON-LD). DB columns stay; they are just not shown.
- A profile is public only when `status = 'published'`, not hidden, and it has a **consent date** (demo excepted).
- Doctor photos only with the doctor's approval (checkbox + note).
- Physiotherapists are «أخصائي/أخصائية علاج طبيعي», never «د.» unless a documented title supports it.
- Listed doctors are Saudi nationals (owner's selection). Nationality data is **not** stored. Never infer it from name/photo.
- **Placement is never sold. No paid ads for doctors.** Public order is set manually by the owner in admin; the site never mentions or explains any ranking/ordering method (no "how we rank" page for now).
- Never sell or share personal data. Correction requests keep only: name, email, relationship, profile, message (+ consent time); erased after the retention period the lawyer sets (`CORRECTION_RETENTION_DAYS`).
- The WhatsApp click counter stores **count + date per profile only**.
- Legal pages (privacy, terms) must describe what the code **actually** does. Re-audit them whenever data collection changes.
- No scraping, no bypassing terms of service.
- Secrets only in environment variables, never in client code (`SUPABASE_SERVICE_ROLE_KEY` is server-only). RLS on every table.

## Tech

- Next.js (App Router, `src/app`), Postgres (local PGlite in `.data/`, Supabase in production), Vercel hosting.
- Read `node_modules/next/dist/docs/` before using a Next.js API you're unsure of (this Next version has breaking changes).
- DB migrations live in `src/lib/db/migrate.ts` — never edit one that already ran; add a new one.
- Design: the system is recorded in `DESIGN.md` (verification-stamp direction: Readex Pro self-hosted, four type sizes, brand blues on white and light gray, grouped lists, spring motion, reduced-motion support). Light only for now; dark mode is an open decision for the owner.
- Checks before pushing: `npm test`, `npm run typecheck`, `npm run build`.

## Environment variables

See `.env.example`. Key ones: `SITE_LIVE`, `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_OWNER_EMAIL`,
`RATE_LIMIT_SECRET`, `CORRECTION_RETENTION_DAYS`.
