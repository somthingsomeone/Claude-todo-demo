---
name: PANIVO (بانيفو)
description: Arabic-first directory of Saudi doctors and physiotherapists in Riyadh, drawn as white appointment slips that lead with the doctor's approved photo, in a light and a dark theme.
colors:
  blue: "#0061f3"
  blue-press: "#0052cc"
  blue-text: "#0052cc"
  sky: "#14b4ff"
  ink: "#001a89"
  plate: "#001a89"
  on-blue: "#ffffff"
  ground: "#f2f3f6"
  slip: "#ffffff"
  wash: "#eaf1ff"
  wash-press: "#dce8ff"
  line: "#e3e6ee"
  tear: "#c9cedb"
  text: "#0e1530"
  text-2: "#4a5373"
  text-3: "#666e8c"
  danger: "#b4232f"
  danger-wash: "#fdecee"
  ok: "#0f7a3d"
  ok-wash: "#e6f4ec"
  warn: "#5c4300"
  warn-wash: "#fff3c4"
  blue-text-dark: "#8db4ff"
  ink-dark: "#9db8ff"
  plate-dark: "#0061f3"
  ground-dark: "#0b0f1a"
  slip-dark: "#151b2b"
  wash-dark: "#17284a"
  wash-press-dark: "#1e3463"
  line-dark: "#273049"
  tear-dark: "#3b4662"
  text-dark: "#eef1f8"
  text-2-dark: "#aab2c9"
  text-3-dark: "#8d96b0"
  danger-dark: "#ff8f98"
  danger-wash-dark: "#3a161b"
  ok-dark: "#74d6a0"
  ok-wash-dark: "#11301f"
  warn-dark: "#ffd98a"
  warn-wash-dark: "#3a2e0c"
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
  circle: "50%"
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
    textColor: "{colors.on-blue}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.ctl}"
    padding: "0 1.25rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.blue-press}"
  button-quiet:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-text}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.ctl}"
    padding: "0 1.25rem"
    height: "3rem"
  button-quiet-hover:
    backgroundColor: "{colors.wash-press}"
  button-round:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.text}"
    rounded: "{rounded.circle}"
    size: "2.75rem"
  button-round-pressed:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-text}"
  search-band:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.on-blue}"
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
  doctor-photo:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-text}"
    typography: "{typography.display}"
    rounded: "{rounded.circle}"
    size: "4.75rem"
  doctor-photo-large:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-text}"
    typography: "{typography.display}"
    rounded: "{rounded.circle}"
    size: "6.5rem"
  slip-stub-whatsapp:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-text}"
    typography: "{typography.label}"
    rounded: "{rounded.inner}"
    padding: "0 0.75rem"
    height: "2.75rem"
  slip-stub-whatsapp-unavailable:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text-2}"
  contact-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.on-blue}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    height: "3.5rem"
    width: "min(calc(100% - 2rem), 30rem)"
  label:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-text}"
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
    textColor: "{colors.blue-text}"
  top-bar:
    backgroundColor: "{colors.slip}"
    height: "3.5rem"
  group-row:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.text}"
    rounded: "{rounded.slip}"
    padding: "0.625rem 1rem"
    height: "3.5rem"
  segmented-control:
    backgroundColor: "{colors.slip}"
    rounded: "{rounded.ctl}"
    padding: "0.25rem"
  segmented-item:
    textColor: "{colors.text-2}"
    height: "2.75rem"
  segmented-item-active:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-text}"
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

**Creative North Star: "The Appointment Slip"**

Every doctor in PANIVO is a white appointment slip lying on a light-gray counter, and every slip leads with the doctor's own face: a round photo the doctor approved, or, until one is approved, a quiet Blue Wash circle holding the first letter of the name. There is no verification badge. Every listed doctor has consented, so the system does not decorate trust; it shows it as plain facts, each with its source and the date it was last checked. Everything else stays quiet so the face, the name and the WhatsApp action are the three things a patient sees.

The world is Arabic-first and right-to-left, set in one sturdy sans (Readex Pro) at exactly four sizes, in Modern Standard Arabic. Brand blue does not sprinkle; it owns whole regions (the search band, the primary button, badges), and that band stays brand blue in both themes. Deep ink blue is the one reversed plate per screen (the doctor page's WhatsApp bar) and the outline of demo markers. Density follows the delivery-app reference the owner named: large cards, one swipeable shelf per specialty, very few words. The site lists doctors only; clinics are a doctor's workplace, named on the slip, never a page of their own.

There are two themes. Light is white slips on cool light gray around the owner's three blues. Dark follows the phone unless the visitor picks a theme in Settings (المظهر: تلقائي / فاتح / داكن): deep navy slips on a near-black ground, light blue for words and outlines, and the plate turning Signal Blue. The category default this world refuses is a white list of interchangeable doctor cards with star ratings and stock portraits: no ratings, no rank numbers, no portrait the doctor did not approve. The separate static intro page (`public/intro/index.html`) was built with a different kit and is outside this system; do not take values from it.

**Key Characteristics:**
- White slips (18px corners, soft tinted shadow) on a counter-gray ground; in dark, navy slips on near-black.
- Every slip and the doctor page lead with the doctor's round photo (or the first-letter circle).
- A dashed tear line separates the facts from the stub: one «الخبرة» cell, then the heart and WhatsApp.
- Brand blue owns regions in both themes; words in blue use Blue Text; sky blue appears only as focus and selection.
- One face, four sizes, three weights (400, 500, 700); tabular numerals everywhere.
- Floating pill tab bar on phones and tablets; from 64rem the three tabs move into the top bar.
- Logical (inline/block) properties throughout, so the layout is native RTL.

**Open decisions (not done, owner to decide):**
- Perforation notches on the slip's tear line were considered and deferred. Today the tear is a dashed line only.

## Colors

Three owner-fixed blues, each with one job, on white and cool light gray (or navy and near-black in dark); status hues stay in forms, legal drafts and admin. Every role is a custom property; dark mode re-points the same properties to the `-dark` values under `:root[data-theme="dark"]` and under `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`. Signal Blue, Pressed Blue and Focus Sky do not change between themes.

### Primary
- **Clinic Signal Blue** (blue): the region owner, in both themes. Fills the full-width search band, the primary button, the search submit, the favourites badge and the admin chart bars; it is also the text caret, the field focus border and the checkbox accent. White on it passes AA (5.24:1).
- **Pressed Blue** (blue-press): hover and press state of every blue fill, in both themes.
- **Blue Text** (blue-text; blue-text-dark): every blue word and line icon: labels, active tabs, quiet buttons, the stub WhatsApp action, the saved heart, row and tile icons, links, breadcrumbs, «عرض الكل», the first letter in an empty photo. Light it equals Pressed Blue (6.02:1 on Blue Wash); dark it is a light periwinkle (7.02:1 on dark Blue Wash, 8.26:1 on the dark slip).

### Secondary
- **WhatsApp Plate** (plate; plate-dark): the one reversed plate per screen, the doctor page's fixed WhatsApp contact bar, white text on it. Light it is the owner's deep ink #001a89 (13.92:1); dark it becomes Clinic Signal Blue (5.24:1), because deep ink disappears on a near-black ground.
- **Outline Ink** (ink; ink-dark): the outline and text of every demo marker (public «ملف تجريبي» and the admin demo state pill), the text of the demo notice strip, and the text of `::selection`. Light 12.28:1 on Blue Wash; dark a pale blue (7.46:1 on dark Blue Wash).

### Tertiary
- **Focus Sky** (sky): focus rings (3px outline, 2px offset), the search field's focus-within ring, the focus glow on form fields (sky at 35% alpha), the selected segment's ring, and `::selection` fill. Nothing else. Unchanged in dark.

### Neutral
- **Counter Gray** (ground; ground-dark): the page ground the slips lie on; also the unavailable WhatsApp stub, chips, admin nav pills, row hover.
- **Slip White** (slip; slip-dark): slips, grouped lists, the top bar, the tab bar, round buttons, tiles, the search field, the segmented track. In dark the slips, tiles and search field inside the blue band turn navy too.
- **On-Blue White** (on-blue): the literal white of text and icons on Clinic Signal Blue and on the plate. It does not change with the theme.
- **Blue Wash** (wash; wash-dark) and **Wash Press** (wash-press; wash-press-dark): the tinted fill behind labels, active tabs and segments, quiet buttons, the stub WhatsApp action, row icons, the empty photo circle, the demo notice strip, tile hover; Wash Press is the quiet-button hover.
- **Hairline** (line; line-dark): 1px dividers between rows, stub cells, top bar edge, tab bar border, field borders.
- **Tear-Line Gray** (tear; tear-dark): the 1.5px dashed tear on slips; the thin shelf scrollbar from 48rem.
- **Night Text** (text; text-dark): primary text (16.2:1 on Counter Gray; 16.92:1 dark).
- **Slate Meta** (text-2; text-2-dark): secondary text: roles, addresses, cell labels, sources, inactive tabs, the search placeholder (7.56:1 on white; 8.11:1 on the dark slip). Under `prefers-contrast: more` the light theme darkens it to #2f3756 and Hairline to #9aa1b8.
- **Placeholder Gray** (text-3; text-3-dark): form-field placeholders only (5.03:1 on white; 5.82:1 dark).
- **Danger** on **Danger Wash**, **OK** on **OK Wash**, **Warn** on **Warn Wash**: form errors, destructive actions, flashes, verdicts and published-state pills (mostly admin); Warn marks the highlighted blanks in legal drafts. Never on public slips.

### Named Rules
**The Three Blues, Three Jobs Rule.** Clinic Signal Blue owns regions, deep ink is the plate and the demo outline, Focus Sky is focus. A blue doing another blue's job is wrong.

**The Blue Words Rule.** Blue text and blue line icons always take Blue Text, never Clinic Signal Blue, so they stay legible on white, on Blue Wash and on the dark slip.

**The Band Stays Blue Rule.** The search band, the primary button and the badges keep Clinic Signal Blue with white in both themes; dark mode changes the ground around them, not the brand.

**The Sky Is Not a Fill Rule.** Focus Sky never carries text and never fills a button, badge or band: white on it is 2.33:1. It exists only as focus rings and selection.

**The One Plate Rule.** At most one reversed plate per screen, and on the public site that plate is the doctor page's WhatsApp contact bar. Demo markers are outlined in ink, never filled.

**The Logo-Only Gradient Rule.** Gradients exist only inside the supplied logo artwork in `public/brand/`. Every surface in the interface is a flat colour.

## Typography

**Display Font:** Readex Pro Variable (self-hosted via `@fontsource-variable/readex-pro`, falling back to Readex Pro, Tahoma, sans-serif)
**Body Font:** the same face
**Label/Mono Font:** the same face

**Character:** One sturdy, open Arabic sans carries everything, from the 28px screen title to the 13px source line. Hierarchy comes from size and weight, never from a second family. All copy is Modern Standard Arabic (فصحى), with no colloquial words mixed in.

### Hierarchy
- **Display** (700, 1.75rem / 28px, 1.3; 1.25 on the doctor's name): screen titles, the search band title, the doctor's name on the profile header, the first letter in an empty photo circle, admin page titles and stat numbers.
- **Title** (700, 1.25rem / 20px, 1.35): slip names, shelf titles, section titles, empty-state titles, prose subheads, admin fieldset legends.
- **Body** (400, 1rem / 16px, 1.65, tabular numerals): running text, field input text, roles on the profile header. Prose measures cap at 44rem, ledes at 40rem.
- **Body Strong** (700 or 500, 1rem): buttons, the contact plate, the active top tab and segment; fact values, FAQ questions and inactive segments use 500.
- **Label** (500, 0.8125rem / 13px; 700 for stub-cell values and badges): meta lines, slip roles and addresses, the stub cell, labels, chips, tab-bar labels, tiles on phones (tiles step up to 16px from 48rem), breadcrumbs, «عرض الكل (n)», source lines, footer.

### Named Rules
**The Four Sizes Rule.** Only `--fs-s` 13px, `--fs-m` 16px, `--fs-l` 20px and `--fs-xl` 28px exist. A new role takes one of the four sizes and a weight; it never adds a fifth size.

**The One Face Rule.** Readex Pro is the only family, self-hosted with the site; no external font service, no second family for numbers or display.

**The Latin-Date Rule.** Dates are written YYYY/MM/DD in Latin digits, as on Saudi forms, in the source line beside every fact: «المصدر · تحقق YYYY/MM/DD».

## Layout

A single centred column (`.wrap`, max 72rem) with a 1rem gutter on phones that widens to 1.5rem from 48rem. Spacing moves in a small rem rhythm: 0.25rem hairline steps inside components, 0.5 to 0.75rem between related items and between slips, 1rem card padding, 1.5rem between page sections.

The home screen is: the demo notice strip (until launch); a sticky top bar (3.5rem, hairline below) with the wordmark at the start and «ما هو بانيفو؟» plus favourites at the end; a full-bleed Clinic Signal Blue band holding the large search field and the five specialty tiles in one row; then one titled shelf per specialty, each with «عرض الكل (n)» at its end. A shelf is a horizontal scroll-snap row of up to ten slips whose columns are `min(86%, 21rem)` on phones (about 1.2 slips visible, inviting the swipe) and `minmax(21rem, 1fr)` from 48rem. Specialty listings and search results use a wrapping grid of the same 21rem minimum. From 48rem the band's inner content caps at 44rem and the doctor page (`.detail`) centres at 44rem.

The doctor page is: a bar with a round back button at the start and share plus save at the end; breadcrumbs; the profile header (large photo beside name, role and tags); the facts group; optional «نبذة» and «يعالج / يساعد في» groups; a correction row that leads to the email page; and the fixed contact plate.

Navigation changes at one breakpoint. Below 64rem a floating pill tab bar (home, saved, settings) hovers 1rem above the bottom safe area, and every page reserves `6.5rem + safe-area` at its foot. From 64rem the three tabs move into the top bar, the floating bar and the top-bar heart disappear, and the foot padding drops to 3rem. On a doctor's page the tab bar gives the bottom edge to the contact plate instead.

Every touch target is at least 2.75rem (44px). All edges are logical (`inline-start`, `block-end`), so RTL is native rather than mirrored.

## Elevation & Depth

A two-level system. Slips and groups rest on the ground with a soft negative-spread shadow; things that float above the page (the tab bar, the contact plate) use a deeper version of it. In light the shadow is tinted with deep ink rather than black, so depth reads blue-cool and paper-like; in dark it is black and stronger, because a tint vanishes on near-black. The top bar is flat: Slip White with a hairline, no shadow, not translucent.

### Shadow Vocabulary
- **Slip rest** (`box-shadow: 0 1px 2px rgba(0, 26, 137, 0.06), 0 10px 24px -14px rgba(0, 26, 137, 0.22)`; dark `0 1px 2px rgba(0, 0, 0, 0.4), 0 10px 24px -14px rgba(0, 0, 0, 0.7)`): slips, grouped lists, FAQ items, empty states, round buttons, the segmented track.
- **Slip hover** (`box-shadow: 0 1px 2px rgba(0, 26, 137, 0.06), 0 16px 32px -14px rgba(0, 26, 137, 0.3)`): slips under a fine pointer on hover only.
- **Float** (`box-shadow: 0 2px 6px rgba(0, 26, 137, 0.08), 0 16px 32px -12px rgba(0, 26, 137, 0.28)`; dark `0 2px 6px rgba(0, 0, 0, 0.45), 0 16px 32px -12px rgba(0, 0, 0, 0.75)`): the floating tab bar and the contact plate.
- **Field on blue** (`box-shadow: 0 8px 20px -10px rgba(0, 26, 137, 0.55)`): the search field lifting off the blue band, in both themes.

### Named Rules
**The Tinted Shadow Rule.** Light shadows are tinted with deep ink (rgba 0, 26, 137), dark shadows are black; both are soft and negative-spread. No hard offsets.

**The Two Heights Rule.** A surface either rests (slip shadow) or floats (float shadow). Bars attached to an edge stay flat with a hairline.

## Shapes

Soft, rounded paper. Slips, groups and empty states take 18px corners; specialty tiles and FAQ items 14px; controls, fields, the search field and the segmented track 12px; elements nested inside a control or stub (search submit, WhatsApp stub action, row icons) 10px. Labels, chips, tabs, the tab bar and the contact plate are full pills; the doctor photo, round icon buttons and the heart are circles. The focus ring draws at 8px.

The slip's signature geometry is the tear: a 1.5px dashed Tear-Line Gray border between the facts and the stub. The stub's cells are separated by 1px Hairline rules. The doctor's photo is the one circle that carries content: 4.75rem on slips, 6.5rem on the doctor page, cropped with `object-fit: cover`.

## Components

### Buttons
Tactile, solid and plain: colour plus a small scale on press, no outlines or gradients.
- **Shape:** gently rounded (12px), 3rem tall, 1.25rem inline padding, 700 weight.
- **Primary:** Clinic Signal Blue fill, white text; hover Pressed Blue; press scales to 0.97; disabled at 50% opacity.
- **Quiet:** Blue Wash fill, Blue Text; hover Wash Press.
- **Round icon button:** 2.75rem Slip White circle with the slip shadow (back, share, save on the doctor page); flat with no shadow in the top bar; pressed or current state is Blue Wash with a Blue Text icon; press scales to 0.92.
- **Heart:** transparent 2.75rem circle, Slate Meta icon, Blue Text and filled when saved; press scales to 0.88; a 10ms vibration confirms a save.
- **Danger (admin only):** Danger Wash fill, Danger text, 2.75rem tall.

### Labels and Chips
- **Label:** pill, Blue Wash fill, Blue Text, 13px/500; carries specialty names (with a 14px specialty icon) and the legal-draft notice.
- **Demo label:** the same pill, transparent with a 1px inset Outline Ink ring and Outline Ink text («ملف تجريبي»). Outlined, never filled.
- **Chip:** pill on Counter Gray, 13px, for the "treats / helps with" list.

### Doctor Photo (signature element)
The doctor's face, shown only after the doctor approved it (checkbox and note in admin). A circle with `object-fit: cover` on a Blue Wash backing: 4.75rem on slips (decorative, empty alt, because the name sits beside it), 6.5rem on the doctor page (alt «صورة …», loaded eagerly). Until a photo exists the same circle holds the first letter of the name in 28px/700 Blue Text, hidden from screen readers.

### Slip (doctor card)
The signature container. Character: an appointment slip you could tear off.
- **Corner Style:** 18px. **Background:** Slip White on Counter Gray. **Shadow:** slip rest, slip hover on fine pointers.
- **Body:** a two-column grid. The start column holds the name (Title, the stretched link that makes the whole slip clickable), role and address (Label, Slate Meta, with a pin icon; the clinic name and the district) and the outlined demo label; the end column holds the doctor photo, spanning those rows.
- **Stub:** below the dashed tear, one fixed `<dl>` cell «الخبرة» (label in Slate Meta over the value in 700 Night Text), omitted when unknown; at the end the actions: the heart, then the WhatsApp action (Blue Wash, Blue Text, 10px, 2.75rem tall). With no number the action becomes a Counter Gray «غير متاح» span.
- **States:** press scales the slip to 0.985; keyboard focus on the stretched link draws the sky ring around the whole slip. From 48rem the address truncates to one line so a row of slips keeps one height.

### Profile Header
The doctor page's top slip: Slip White, 18px, slip shadow, 1.25rem 1rem 1rem padding. A two-column grid: the 6.5rem photo, vertically centred, beside the name (Display, 1.25 line-height), the role (Body, Slate Meta) and a row of tags (the specialty label, then the demo label). No seal row and no badge.

### Search Band
A full-bleed Clinic Signal Blue region, in both themes, with a 28px white title, a 3.5rem search field (Slip White, 12px, field-on-blue shadow, sky ring on focus-within, blue caret) whose 2.75rem blue submit sits at the end, and five specialty tiles (Slip White, 14px, Blue Text line icon over a 13px name; Blue Wash on hover; press 0.96). In dark the field and tiles turn navy on the unchanged blue. Works as a plain GET form without JavaScript.

### Shelf
A titled row: Title-size heading at the start, «عرض الكل (n)» in 13px/500 Blue Text at the end (underlined on hover), then the horizontal scroll-snap track that bleeds to the screen edge. The scrollbar is hidden on phones and thin Tear-Line Gray from 48rem.

### Contact Plate
The doctor page's one reversed plate: a fixed pill (3.5rem, up to 30rem wide) in WhatsApp Plate with white 700 text and the WhatsApp icon, floating 1rem above the bottom safe area with the float shadow; press scales to 0.97. Without a number it becomes a Slip White pill with a hairline border and a 13px Slate Meta explanation.

### Grouped Lists and Facts
iOS-style grouped lists: a Slip White 18px group with the slip shadow, rows at least 3.5rem tall, divided by hairlines. Each row leads with a 2.25rem Blue Wash icon tile (10px, Blue Text icon), then text, then a chevron. On the doctor page each fact row is label (13px Slate Meta), value (16px/500) and source line («المصدر · تحقق YYYY/MM/DD», 13px Slate Meta): the source and date always sit beside the fact, and the bio and treats groups end with the same line.

### Segmented Control (المظهر)
The theme choice in Settings: a 13px/500 Slate Meta legend over a Slip White track (12px, 0.25rem padding, slip shadow) of three equal segments, تلقائي / فاتح / داكن, each 2.75rem tall. The chosen segment is Blue Wash with Blue Text 700; keyboard focus draws the sky ring. The choice is applied at once and saved on the device; an inline script applies it before the first paint.

### Inputs / Fields
- **Style:** 3rem tall, Slip White, 1px Hairline border, 12px corners, 16px text; the label sits above in 13px/500 Slate Meta; placeholders in Placeholder Gray.
- **Focus:** border turns Clinic Signal Blue with a 3px Focus Sky glow at 35% alpha.
- **Error:** a Danger Wash block with Danger text above the form; checkboxes use `accent-color` Clinic Signal Blue. Forms are admin-only now; public corrections go by email.

### Navigation
- **Top bar:** sticky, 3.5rem, Slip White with a bottom hairline; the supplied wordmark (1.75rem tall) at the start, swapping between the artwork made for white (light) and the transparent artwork (dark); at the end the «ما هو بانيفو؟» link and the favourites round button with its count badge.
- **Floating tab bar (below 64rem):** a Slip White pill up to 22rem wide with a hairline border and float shadow; three equal items (22px icon over 13px label); active is a Blue Wash pill with Blue Text 700; press 0.94. The favourites badge is a small Clinic Signal Blue pill with a white 13px count.
- **Top tabs (from 64rem):** the same three items as text pills in the top bar, 2.75rem tall, inactive Slate Meta 500, active Blue Wash with Blue Text 700.
- **Breadcrumbs:** 13px Slate Meta with Blue Text links and small chevrons.
- **Footer:** hairline-topped, 13px, the transparent footer wordmark, link columns in Slate Meta (Blue Text on hover), and the not-medical-advice note.

## Do's and Don'ts

### Do:
- **Do** keep blue in whole regions (band, primary button, badges) in both themes, and use Blue Text for every blue word or line icon.
- **Do** lead every slip and the doctor page with the doctor's round photo, or the first-letter circle until an approved photo exists.
- **Do** put the source plus last-checked date («المصدر · تحقق YYYY/MM/DD») beside every fact on the doctor page.
- **Do** keep the slip's anatomy: name, role, address and demo label at the start, photo at the end, a 1.5px dashed tear line, then the «الخبرة» cell and the heart plus WhatsApp action in the stub.
- **Do** define every colour as a custom property with a light value and a dark value, and set dark values in both the `data-theme="dark"` block and the `prefers-color-scheme: dark` block.
- **Do** use only the four sizes (13, 16, 20, 28px) and the weights 400, 500 and 700 of Readex Pro.
- **Do** keep press feedback to small scales on a 120ms `cubic-bezier(0.16, 1, 0.3, 1)`, and let `prefers-reduced-motion: reduce` cut transitions and animations.
- **Do** keep touch targets at 2.75rem or larger and write every edge with logical properties.
- **Do** mark demo profiles with the outlined Outline Ink label and the «تجريبي» notice strip.

### Don't:
- **Don't** put white text on Focus Sky (2.33:1) or use it for anything but focus and selection.
- **Don't** use Clinic Signal Blue for small blue text; it is a fill colour.
- **Don't** add a second reversed plate to a screen, and don't fill demo markers.
- **Don't** use gradients anywhere outside the supplied logo artwork, and don't recolour, stretch, shadow, filter or add effects to the logo or wordmark; dark mode swaps to the supplied transparent artwork instead.
- **Don't** show star ratings, rating numbers, review counts, rank numbers, "top" ribbons or any visual that implies an order of merit; public order is set by the owner and never described.
- **Don't** add verification badges, seals, stamps or «موثّق» wording; every listed doctor consented, and the facts with their sources carry the trust.
- **Don't** use stock photos, generated faces or any portrait without the doctor's recorded approval.
- **Don't** give clinics public pages or slips; a clinic appears only as the doctor's workplace in the address line and the facts.
- **Don't** add a fifth type size or a second typeface.
