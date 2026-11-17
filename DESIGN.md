---
name: PANIVO (بانيفو)
description: Arabic-first directory of verified doctors and physiotherapists in Riyadh, drawn as white appointment slips with an ink-blue verification stamp.
colors:
  blue: "#0061f3"
  blue-press: "#0052cc"
  ink: "#001a89"
  sky: "#14b4ff"
  ground: "#f2f3f6"
  slip: "#ffffff"
  wash: "#eaf1ff"
  line: "#e3e6ee"
  tear: "#c9cedb"
  text: "#0e1530"
  text-2: "#4a5373"
  danger: "#b4232f"
  danger-wash: "#fdecee"
  ok: "#0f7a3d"
  ok-wash: "#e6f4ec"
typography:
  display:
    fontFamily: "Readex Pro Variable, Readex Pro, Tahoma, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Readex Pro Variable, Readex Pro, Tahoma, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Readex Pro Variable, Readex Pro, Tahoma, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    fontFeature: "tnum"
  body-strong:
    fontFamily: "Readex Pro Variable, Readex Pro, Tahoma, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.65
  label:
    fontFamily: "Readex Pro Variable, Readex Pro, Tahoma, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.35
rounded:
  slip: "18px"
  tile: "14px"
  ctl: "12px"
  inner: "10px"
  pill: "999px"
spacing:
  hair: "0.25rem"
  tight: "0.5rem"
  shelf-gap: "0.75rem"
  gutter: "1rem"
  gutter-wide: "1.5rem"
  section: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.slip}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.ctl}"
    padding: "0 1.25rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.blue-press}"
  button-quiet:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-press}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.ctl}"
    padding: "0 1.25rem"
    height: "3rem"
  button-round:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    size: "2.75rem"
  button-round-pressed:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue}"
  search-band:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.slip}"
    padding: "1.25rem 0 1.5rem"
  search-field:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.ctl}"
    height: "3.5rem"
  specialty-tile:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.tile}"
    padding: "0.75rem 0.25rem 0.625rem"
  specialty-tile-hover:
    backgroundColor: "{colors.wash}"
  slip:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.text}"
    rounded: "{rounded.slip}"
    padding: "1rem 1rem 0.875rem"
  slip-stub-whatsapp:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-press}"
    typography: "{typography.label}"
    rounded: "{rounded.inner}"
    padding: "0 0.75rem"
    height: "2.75rem"
  slip-stub-whatsapp-unavailable:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text-2}"
  contact-plate:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.slip}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    height: "3.5rem"
    width: "min(calc(100% - 2rem), 30rem)"
  label:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-press}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.6rem"
  label-demo:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.6rem"
  chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 0.8rem"
  tab-bar:
    backgroundColor: "{colors.slip}"
    rounded: "{rounded.pill}"
    padding: "0.375rem"
    width: "min(calc(100% - 2rem), 22rem)"
  tab-bar-item:
    textColor: "{colors.text-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "3.25rem"
  tab-bar-item-active:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-press}"
  top-bar:
    backgroundColor: "{colors.slip}"
    height: "3.5rem"
  group-row:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.text}"
    rounded: "{rounded.slip}"
    padding: "0.625rem 1rem"
    height: "3.5rem"
  text-field:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.ctl}"
    padding: "0.625rem 0.875rem"
    height: "3rem"
---

# Design System: PANIVO (بانيفو)

## Overview

**Creative North Star: "The Stamped Appointment Slip"**

Every doctor in PANIVO is a white appointment slip lying on a light-gray counter, and every slip carries a round ink-blue verification stamp holding the date the facts were last checked. The stamp is the system's one ornament and its whole argument: trust is shown next to the facts it vouches for, not claimed in a headline. Everything else stays quiet so the stamp and the WhatsApp action are the two things a patient sees.

The world is Arabic-first and right-to-left, set in one sturdy sans (Readex Pro) at exactly four sizes, in Modern Standard Arabic. Brand blue does not sprinkle; it owns whole regions (the search band, active tabs, the primary button). Stamp ink is used as ink, and once per screen as a reversed plate. Density follows the delivery-app reference the owner named: large cards, swipeable shelves, very few words. The interface is light only for now: white and light gray around the three owner-fixed brand blues.

The category default this world refuses is a white list of interchangeable doctor cards with star ratings and stock portraits. There are no ratings, no rank numbers and no portraits that the doctor did not approve. The separate static intro page (`public/intro/index.html`) was built with a different kit and is outside this system; do not take values from it.

**Key Characteristics:**
- White slips (18px corners, soft ink-tinted shadow) on a counter-gray ground.
- A dashed tear line separates the facts from the stub of fixed cells and the WhatsApp action.
- One round ink-blue stamp per slip, rotated -8°, pressing in as it scrolls into view.
- Brand blue owns regions; sky blue appears only as focus and selection.
- One face, four sizes, three weights (400, 500, 700); tabular numerals everywhere.
- Floating pill tab bar on phones and tablets; from 64rem the three tabs move into the top bar.
- Logical (inline/block) properties throughout, so the layout is native RTL.

**Open decisions (not done, owner to decide):**
- Dark mode. The project rules list dark mode as a general design aim, but the owner specified white and light gray; the build ships `color-scheme: light` only. No dark tokens exist.
- Perforation notches on the slip's tear line were considered and deferred. Today the tear is a dashed line only.

## Colors

Three owner-fixed blues, each with one job, on white and cool light gray; two status hues stay in forms and admin.

### Primary
- **Clinic Signal Blue** (blue): the region owner. Fills the full-width search band, the primary button, the search submit, the favourites badge, admin chart bars; colours tile icons, the text caret, the "more" links, the saved heart. White on it passes AA (5.24:1).
- **Pressed Blue** (blue-press): hover and press state of every blue fill, and the blue used for text on Blue Wash (labels, active tabs, quiet buttons, breadcrumbs, links) because it holds 6.02:1 there where Clinic Signal Blue holds only 4.63:1.

### Secondary
- **Stamp Ink** (ink): the stamp, the «ملف موثّق» statement beside the large stamp, the outline and text of demo markers, the demo notice text, and the one reversed plate per screen: the doctor page's WhatsApp contact bar (white on it, 13.92:1).

### Tertiary
- **Focus Sky** (sky): focus rings (3px outline, 2px offset), the search field's focus-within ring, the focus glow on form fields (sky at 35% alpha), and `::selection` (with Stamp Ink text, 5.97:1). Nothing else.

### Neutral
- **Counter Gray** (ground): the page ground the slips lie on; also the unavailable WhatsApp stub, chips, admin nav pills, and row hover.
- **Slip White** (slip): slips, grouped lists, the top bar, the tab bar, round buttons, tiles, the search field, and every white text-on-blue/ink.
- **Blue Wash** (wash): the tinted fill behind labels, active tabs, quiet buttons, the WhatsApp stub action, row icons, the demo notice strip, and tile hover.
- **Hairline** (line): 1px dividers between rows, stub cells, top bar edge, tab bar border, field borders.
- **Tear-Line Gray** (tear): the 1.5px dashed tear on slips and the profile seal; the thin scrollbar on shelves from 48rem.
- **Night Text** (text): primary text (16.2:1 on Counter Gray).
- **Slate Meta** (text-2): secondary text: roles, addresses, cell labels, sources, inactive tabs (6.82:1 on Counter Gray, 7.56:1 on white). Under `prefers-contrast: more` it darkens to #2f3756 and Hairline to #9aa1b8.
- **Danger** (danger) on **Danger Wash** (danger-wash), **OK** (ok) on **OK Wash** (ok-wash): form errors, destructive actions, flashes, verdicts and published-state pills, mostly in admin. Never on public slips.

### Named Rules
**The Three Blues, Three Jobs Rule.** Clinic Signal Blue owns regions, Stamp Ink is ink, Focus Sky is focus. A blue that is doing another blue's job is wrong.

**The Sky Is Not a Fill Rule.** Focus Sky never carries text and never fills a button, badge or band: white on it is 2.33:1. It exists only as focus rings and selection.

**The One Plate Rule.** At most one reversed Stamp Ink plate per screen, and on the public site that plate is the doctor page's WhatsApp contact bar. Demo markers are outlined in ink, never filled.

**The Logo-Only Gradient Rule.** Gradients exist only inside the supplied logo artwork in `public/brand/`. Every surface in the interface is a flat colour.

## Typography

**Display Font:** Readex Pro Variable (self-hosted via `@fontsource-variable/readex-pro`, falling back to Readex Pro, Tahoma, sans-serif)
**Body Font:** the same face
**Label/Mono Font:** the same face

**Character:** One sturdy, open Arabic sans carries everything, from the 28px screen title to the 13px stamp-date cell. Hierarchy comes from size and weight, never from a second family. All copy is Modern Standard Arabic (فصحى), with no colloquial words mixed in.

### Hierarchy
- **Display** (700, 1.75rem / 28px, 1.3; 1.25 on the doctor's name): screen titles, the search band title, the doctor's name on the profile slip, admin page titles and stat numbers.
- **Title** (700, 1.25rem / 20px, 1.35): slip names, shelf titles, section titles, empty-state titles, prose subheads, admin fieldset legends.
- **Body** (400, 1rem / 16px, 1.65, tabular numerals): running text, field input text, roles on the profile slip. Prose measures cap at 44rem, ledes at 40rem.
- **Body Strong** (700 or 500, 1rem): buttons, the contact plate, the active top tab; fact values and FAQ questions use 500.
- **Label** (500, 0.8125rem / 13px; 700 for stub-cell values and badges): meta lines, slip roles and addresses, stub cells, labels, chips, tab-bar labels, tiles on phones (tiles step up to 16px from 48rem), breadcrumbs, footer.

### Named Rules
**The Four Sizes Rule.** Only `--fs-s` 13px, `--fs-m` 16px, `--fs-l` 20px and `--fs-xl` 28px exist. A new role takes one of the four sizes and a weight; it never adds a fifth size.

**The One Face Rule.** Readex Pro is the only family, self-hosted with the site; no external font service, no second family for numbers or display.

**The Latin-Date Rule.** Dates are written YYYY/MM/DD in Latin digits, in an LTR run (`dir="ltr"`), as on Saudi forms, so stamp, stub and source line read identically.

## Layout

A single centred column (`.wrap`, max 72rem) with a 1rem gutter on phones that widens to 1.5rem from 48rem. Spacing moves in a small rem rhythm: 0.25rem hairline steps inside components, 0.5 to 0.75rem between related items and between slips, 1rem card padding, 1.5rem between page sections.

The home screen is: a white top bar (3.5rem, sticky, hairline below) with the wordmark at the start and favourites at the end; a full-bleed Clinic Signal Blue band holding the large white search field and the five specialty tiles in one row; then titled shelves. A shelf is a horizontal scroll-snap row whose columns are `min(86%, 21rem)` on phones (about 1.2 slips visible, inviting the swipe) and `minmax(21rem, 1fr)` from 48rem. Listing pages use a wrapping grid of the same 21rem minimum. From 48rem the band's inner content caps at 44rem, and the doctor page (`.detail`) centres at 44rem.

Navigation changes at one breakpoint. Below 64rem a floating pill tab bar (three tabs: home, saved, settings) hovers 1rem above the bottom safe area, and every page reserves `6.5rem + safe-area` at its foot so nothing hides under it. From 64rem the three tabs move into the top bar, the floating bar and the top-bar heart disappear, and the foot padding drops to 3rem. On a doctor's page the tab bar gives the bottom edge to the contact plate instead.

Every touch target is at least 2.75rem (44px). All edges are logical (`inline-start`, `block-end`), so RTL is native rather than mirrored.

## Elevation & Depth

A light, two-level system. Slips and groups rest on Counter Gray with a soft shadow tinted with Stamp Ink rather than black, so depth reads blue-cool and paper-like. Things that float above the page (the tab bar, the contact plate) use a deeper version of the same shadow. The top bar is flat: Slip White with a hairline, no shadow, not translucent.

### Shadow Vocabulary
- **Slip rest** (`box-shadow: 0 1px 2px rgba(0, 26, 137, 0.06), 0 10px 24px -14px rgba(0, 26, 137, 0.22)`): slips, grouped lists, FAQ items, empty states, round buttons.
- **Slip hover** (`box-shadow: 0 1px 2px rgba(0, 26, 137, 0.06), 0 16px 32px -14px rgba(0, 26, 137, 0.3)`): slips under a fine pointer on hover only.
- **Float** (`box-shadow: 0 2px 6px rgba(0, 26, 137, 0.08), 0 16px 32px -12px rgba(0, 26, 137, 0.28)`): the floating tab bar and the contact plate.
- **Field on blue** (`box-shadow: 0 8px 20px -10px rgba(0, 26, 137, 0.55)`): the search field lifting off the blue band.

### Named Rules
**The Ink Shadow Rule.** Shadows are tinted with Stamp Ink (rgba 0, 26, 137), soft and negative-spread. No grey-black shadows, no hard offsets.

**The Two Heights Rule.** A surface either rests (slip shadow) or floats (float shadow). Bars attached to an edge stay flat with a hairline.

## Shapes

Soft, rounded paper. Slips, groups and empty states take 18px corners; specialty tiles and FAQ items 14px; controls, fields, the search field and slip photos 12px; elements nested inside a control or stub (search submit, WhatsApp stub action, row icons) 10px; the profile photo 16px. Labels, chips, tabs, the tab bar and the contact plate are full pills; round icon buttons and the heart are circles. The focus ring draws at 8px.

The slip's signature geometry is the tear: a 1.5px dashed Tear-Line Gray border between the facts and the stub, repeated on the doctor page's seal row. The stub's cells are separated by 1px Hairline rules. The stamp is a double ring (3.5 and 1.25 unit strokes) with a check mark, «موثّق» and the date, rotated -8°, drawn at 4.75rem on slips and 6rem on the profile.

## Components

### Buttons
Tactile, solid and plain: colour plus a small scale on press, no outlines or gradients.
- **Shape:** gently rounded (12px), 3rem tall, 1.25rem inline padding, 700 weight.
- **Primary:** Clinic Signal Blue fill, white text; hover Pressed Blue; press scales to 0.97; disabled at 50% opacity.
- **Quiet:** Blue Wash fill, Pressed Blue text; hover deepens the wash to #dce8ff.
- **Round icon button:** 2.75rem white circle with the slip shadow (back, share, save on the doctor page); flat with no shadow in the top bar; pressed state is Blue Wash with blue icon; press scales to 0.92.
- **Heart:** transparent 2.75rem circle, Slate Meta icon, Clinic Signal Blue and filled when saved; press scales to 0.88; a 10ms vibration confirms a save.
- **Danger (admin only):** Danger Wash fill, Danger text, 2.75rem tall.

### Labels and Chips
- **Label:** pill, Blue Wash fill, Pressed Blue text, 13px/500; carries specialty names and the legal-draft notice.
- **Demo label:** the same pill, transparent with a 1px inset Stamp Ink outline and Stamp Ink text («ملف تجريبي», «عيادة تجريبية»). Outlined, never filled.
- **Chip:** pill on Counter Gray, 13px, for the "treats / helps with" list.

### Slip (doctor card)
The signature container. Character: an appointment slip you could tear off.
- **Corner Style:** 18px. **Background:** Slip White on Counter Gray. **Shadow:** slip rest, slip hover on fine pointers.
- **Body:** a two-column grid. The start column holds the name (Title, the stretched link that makes the whole slip clickable), role and address (Label, Slate Meta, with a pin icon) and the demo label; the end column holds the stamp, then the approved photo (3.5rem, 12px) if any, then the heart.
- **Stub:** below the dashed tear, fixed `<dl>` cells: «الخبرة» | «آخر تحقق», label in Slate Meta over value in 700 Night Text, separated by a hairline; the WhatsApp action at the end (Blue Wash, Pressed Blue, 10px, 2.75rem tall). With no number, the action becomes a Counter Gray «غير متاح» span.
- **States:** press scales the slip to 0.985; keyboard focus on the stretched link draws the sky ring around the whole slip.
- **Clinic slip:** the same slip in one column: name, district with a building icon, specialty labels; the stub holds the doctor count and «عرض العيادة».

### Stamp (signature ornament)
An inline SVG in `currentColor` (Stamp Ink), with an `aria-label` that reads the consent and date. It presses onto the slip as it enters view: a scroll-driven `animation-timeline: view()` from 10% to 70% of entry, from scale 1.14, 20% opacity and a 1.5px blur to rest. It only animates where `animation-timeline` is supported and `prefers-reduced-motion: no-preference`; otherwise it is simply there.

### Search Band
A full-bleed Clinic Signal Blue region with a 28px white title, a 3.5rem white search field (12px, field-on-blue shadow, sky ring on focus-within, blue caret) whose 2.75rem blue submit sits at the end, and five white specialty tiles (14px, blue line icon over a 13px name; Blue Wash on hover; press 0.96). Works as a plain GET form without JavaScript.

### Contact Plate
The doctor page's one reversed plate: a fixed pill (3.5rem, up to 30rem wide) in Stamp Ink with white 700 text and the WhatsApp icon, floating 1rem above the bottom safe area with the float shadow; press scales to 0.97. Without a number it becomes a white pill with a hairline border and a 13px Slate Meta explanation.

### Inputs / Fields
- **Style:** 3rem tall, Slip White, 1px Hairline border, 12px corners, 16px text; the label sits above in 13px/500 Slate Meta.
- **Focus:** border turns Clinic Signal Blue with a 3px Focus Sky glow at 35% alpha.
- **Error:** a Danger Wash block with Danger text above the form; checkboxes use `accent-color` Clinic Signal Blue.

### Grouped Lists and Facts
iOS-style grouped lists: a white 18px group with the slip shadow, rows at least 3.5rem tall, divided by hairlines. Each row leads with a 2.25rem Blue Wash icon tile (10px), then text, then a chevron. On the doctor page each fact row is label (13px Slate Meta), value (16px/500) and source line ("المصدر · تحقق YYYY/MM/DD", 13px Slate Meta): the source and date always sit beside the fact.

### Navigation
- **Top bar:** sticky, 3.5rem, Slip White with a bottom hairline; the supplied wordmark (1.75rem tall) at the start; at the end the «ما هو بانيفو؟» link and the favourites round button with its count badge.
- **Floating tab bar (below 64rem):** a white pill up to 22rem wide with a hairline border and float shadow; three equal items (22px icon over 13px label); active is a Blue Wash pill with Pressed Blue 700 text; press 0.94. The favourites badge is a small Clinic Signal Blue pill with white 13px count.
- **Top tabs (from 64rem):** the same three items as text pills in the top bar, 2.75rem tall, inactive Slate Meta 500, active Blue Wash with Pressed Blue 700.
- **Breadcrumbs:** 13px Slate Meta with Pressed Blue links and small chevrons.
- **Footer:** hairline-topped, 13px, the footer wordmark, link columns in Slate Meta (Pressed Blue on hover), and the not-medical-advice note.

## Do's and Don'ts

### Do:
- **Do** keep blue in whole regions (band, primary button, active state) and use Pressed Blue (#0052cc) for any blue text on Blue Wash.
- **Do** put the consent stamp on every slip and the source plus last-checked date beside every fact.
- **Do** keep the slip's anatomy: facts and stamp above a 1.5px dashed tear line, fixed stub cells «الخبرة» | «آخر تحقق», WhatsApp action at the end of the stub.
- **Do** use only the four sizes (13, 16, 20, 28px) and the weights 400, 500 and 700 of Readex Pro.
- **Do** keep the stamp static under reduced motion, and keep press feedback to small scales on a 120ms `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Do** keep touch targets at 2.75rem or larger and write every edge with logical properties.
- **Do** mark demo profiles with the outlined Stamp Ink label and the «تجريبي» notice strip.

### Don't:
- **Don't** put white text on Focus Sky (#14b4ff, 2.33:1) or use it for anything but focus and selection.
- **Don't** add a second reversed Stamp Ink plate to a screen, and don't fill demo markers.
- **Don't** use gradients anywhere outside the supplied logo artwork, and don't recolour, stretch, shadow or add effects to the logo or wordmark.
- **Don't** show star ratings, rating numbers, review counts, rank numbers, "top" ribbons or any visual that implies an order of merit; public order is set by the owner and never described.
- **Don't** use stock photos of doctors or any portrait without the doctor's recorded approval.
- **Don't** add ornament beyond the stamp: no illustrations, patterns, badges or decorative icons on slips.
- **Don't** add a fifth type size or a second typeface.
- **Don't** ship a dark theme until the owner decides; the system is light only today.
