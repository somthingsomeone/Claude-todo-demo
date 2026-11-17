# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Patients and families in Riyadh, of any nationality**, looking for a doctor or physiotherapist on their phone. Many arrive from social media posts and ads, on mid-range Android phones, often outdoors. Their job: find a suitable specialist quickly, trust what they read, and contact the clinic.
- **The owner (admin)**: a non-technical founder who adds and edits doctor profiles, records consent, sets the order in which doctors appear, and reads WhatsApp click counts in `/admin`.

## Product Purpose

PANIVO (بانيفو) is a mobile-first directory of **Saudi** doctors and physiotherapists in Riyadh. Phase 1 lists profiles and sends patients to the clinic on WhatsApp; nothing is booked or paid on the site. Success for the 90-day test: WhatsApp clicks per month (>300 → phase 2; 100–300 → improve marketing; <100 → rethink).

## Positioning

- Every published profile has the doctor's consent, a source for each fact, and a last-checked date.
- Placement is never sold and there are no paid ads for doctors.
- Contact goes straight from the patient to the clinic.

## Operating Context

- Specialties: جلدية، تجميل وليزر، عيون، أسنان، علاج طبيعي.
- Launch city: Riyadh only. Every specialty × city page needs its own written text.
- Contact is a WhatsApp deep link with a prefilled message; only click count + date per profile is stored.
- Admin workflow: draft → published (publishing needs a consent date), temporary hide, photo upload only with the doctor's approval, correction/removal requests, audit log.

## Capabilities and Constraints

- Public order of doctors is set manually by the owner. **The site does not describe or mention any ranking or ordering method.** No "how we rank" page for now.
- No star ratings, rating numbers or review counts anywhere public.
- Physiotherapists are «أخصائي/أخصائية علاج طبيعي», never «د.» unless a documented title supports it.
- Doctors listed are Saudi nationals (owner's selection policy). The site stores no nationality data and never infers nationality from a name or photo.
- No "nearest to you" or location features until a native app exists.
- Server-rendered pages, readable without JavaScript; built for search engines and AI assistants. `SITE_LIVE=false` keeps everything `noindex` and shows demo data.
- Clinics are currently a text field on each doctor; clinic pages need a clinic record.
- Stack: Next.js (App Router) + Postgres (Supabase in production) on Vercel.

## Brand Commitments

- Name: PANIVO, Arabic بانيفو. Trademark check with SAIP still pending.
- Logo: the owner's P mark (bar + D bowl + circle) and the lowercase geometric "panivo" wordmark, supplied as images (`public/brand/`). Do not recolor, stretch or add effects.
- Colors fixed by the owner: #0061F3 primary, #14B4FF light, #001A89 dark; everything else white and light gray. Gradients only inside the logo.
- Arabic-first, right-to-left. Site copy is consistent Modern Standard Arabic (فصحى); no colloquial words mixed in.
- A custom Arabic web font, self-hosted (no external font services).
- Reference feel named by the owner: Saudi delivery apps such as HungerStation (large cards, swipeable shelves, very little text).

## Evidence on Hand

- Doctor data is currently fictional demo data (`demo-` profiles, marked «تجريبي»). No real doctors, photos, clinic photos, testimonials or press yet. Do not fabricate any of them, and do not use stock photos of doctors.
- Legal pages (terms, privacy) exist as drafts awaiting a Saudi lawyer; placeholders: [اسم الجهة], [رقم السجل التجاري], [إيميل التواصل].

## Product Principles

1. Contacting the clinic is the one action that matters; everything leads to the WhatsApp button.
2. Trust is shown, not claimed: consent, source and last-checked date sit next to the facts.
3. Never fake: no invented doctors, reviews, photos or rankings presented as real.
4. Few words: patients scan, they don't read.

## Accessibility & Inclusion

- Readable outdoors on mid-range phones: WCAG AA contrast (4.5:1 for body text), 44px touch targets.
- Respect reduced motion and the user's text size.
