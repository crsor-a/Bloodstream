# Bloodstream

A personal, local-first web app that tracks Adderall (mixed amphetamine salts, IR and XR) and its
generics: where a dose is in the bloodstream right now, how strong it likely feels, sleep
interference at a planned bedtime, and zone-based effect summaries across ADHD-related areas of
functioning. Version 4 adds saved medications and schedules, doctor logging with a library of
articles, appointments, incognito mode and living backgrounds. 4.1 personalizes the model (Body &
medicines: weight, kidneys, diet, medicines, meals) with a range band and an ng/mL estimate.
Owner: Rauf (crsor-a). Primary device: iPhone, installed to the Home Screen.

## Commands

- `npm run dev` start the dev server
- `npm test` run the Vitest suites (model, physio, storage, migration, schedules, content, zones). Run before every commit.
- `npm run build` typecheck + production build into `dist/` (includes the service worker)
- `npm run preview` serve the build locally (the service worker only works on https or localhost)

Deploy: pushing to `main` runs `.github/workflows/deploy.yml` (test, build, publish to GitHub
Pages at https://crsor-a.github.io/Bloodstream/). Pages source must be set to "GitHub Actions"
in the repo settings.

## Stack and layout

Vite 5 + TypeScript (strict) + Preact 10 with `@preact/signals`. `idb` for IndexedDB.
`vite-plugin-pwa` (Workbox, autoUpdate) for the manifest and offline support. No backend.

```
src/
  model/pk.ts          single-dose pharmacokinetics (pure functions); takes a Band or PkParams
  model/physio.ts      Body + age band -> PkParams (half-life multiplier, XR absorption variant),
                       range band, ng/mL scale, factor list, cycle phase (pure, tests/physio.test.ts)
  model/regimen.ts     multi-dose superposition, phases, key times, sleep index
  model/schedule.ts    schedule slots, due/missed states, skips (pure)
  model/copy.ts        effectivity, phase, sleep, greeting and incognito wording; DISCLAIMER; AREA_IDS
  model/types.ts       Dose, Med, Schedule, LogEntry, Appointment, Theme, Profile, Body, Settings
  content/suggestions.ts  logging categories, ~140 suggestions (urgency + article), guidance text
  content/articles/    37 articles (safety, effects, everyday, areas); index.ts has lookup + search
  content/sources.ts   every citation URL, reused by articles
  content/types.ts     article block/visual format
  lib/storage.ts       IndexedDB store (v2), fallbacks, legacy import, backup format 2
  lib/zones.ts         seven effectivity zones and colors
  lib/area.ts          area value/zone at a time, series, next zone change (for adaptive articles)
  lib/sun.ts           solar position, sunrise/sunset, approximate location from the time zone
  lib/notify.ts        notification permission + in-app reminder timers
  lib/ics.ts           Calendar exports (weekly schedules, single appointments)
  lib/share.ts         share sheet / download / clipboard helpers
  lib/names.ts         dose labels using saved medication names
  lib/units.ts         weight input parsing (kg/lb)
  lib/time.ts, lib/pill.ts, lib/calendar.ts   as before
  changelog.ts         APP_VERSION + release history (shown on its own page)
  state.ts             signals + every action that mutates data (single write path)
  views/               Onboarding (8 pages), Dashboard, Header (top bar, greeting, disclaimer),
                       AddSheet (log / medications / schedules / reminders), DueCards, DoseForm,
                       DoseList, Calendar, Curve, Sleep, Effectivity, DataCard, Appearance,
                       LogSheet, Library, Appointments, Reader, LoggingTour, UpgradeTour,
                       Incognito, Changelog, RetroDose, Personalize (Body & medicines viewer)
  components/          controls (Segmented, Switch, Sheet, Collapse, Toast, useOverlay),
                       PillEditor, Visuals (article charts), Background + shaders (WebGL effects)
  styles/app.css       the whole design system (tokens at the top, v4 section at the end)
tests/               Vitest; fake-indexeddb for storage; migration.test.ts builds a real v1 DB
public/sw-notify.js  notification click handler imported into the generated service worker
public/icons/        plain white teardrop on black, same shape as the top-bar brand mark.
                     To change the icon, use NEW file names (caches and iOS keep old URLs).
```

Rules of the road:
- UI never writes to storage directly. Add an action in `state.ts`.
- Model code stays pure and unit-tested. If you change a constant in `pk.ts`, the label-anchor
  tests in `tests/pk.test.ts` must still pass (IR Tmax ≈ 3 h, XR ≈ 7 h, half-lives by age).
- Copy lives in `model/copy.ts`, not inline in components, except one-off labels. Article text
  lives in `content/articles/`, suggestion text and guidance in `content/suggestions.ts`.
- Every suggestion must point at an existing article, and every article needs `covers` and at
  least one source. `tests/content.test.ts` enforces this.

## Releases and versioning

MAJOR.MINOR.PATCH. MAJOR = a rebuild or any change to how saved data is stored (always with a
migration that keeps existing data). MINOR = new features. PATCH = fixes and visual polish.
To release: add an entry at the top of `src/changelog.ts`, set `APP_VERSION` to match, bump
`package.json`. Returning users get an "Updated to X" toast and a NEW badge on the changelog
until it has been on screen (`settings.seenVersion`).

Updates: the service worker is registered in `src/main.tsx` (autoUpdate, skipWaiting +
clientsClaim). It checks on launch, on resume and hourly, and reloads into the new version.
Data lives in IndexedDB, so updates never touch it. Never add code that clears storage on update.

## Design rules (keep these)

- Apple / SwiftUI feel: pitch-black background (#000), iOS inset-grouped cards (#1c1c1e),
  segmented controls, switches, bottom sheets, toasts, full-screen viewers that push in from the
  right. System SF font stack; the article reader uses ui-serif (New York on Apple devices).
- **White is the only accent.** No red/pink accents. Semantic colors are allowed only for
  information: the sleep severity gauge, the seven effectivity zones (red baseline to green full
  effect; appetite suppression and physical stimulation run the other way so green always means
  settled), logging urgency (emergency #ff453a, stop #ff6b3d, soon #ff9f0a), and destructive actions.
- With no background effect, bars are solid black. When a background effect is on, `html.glass`
  makes cards, bars, sheets and viewers translucent with backdrop blur. Incognito turns effects off.
- The customizable pill is the hero. After logging, the pill flies to the center and a white
  line sweeps down through it to the share remaining; everything above the line is ghosted.
- Mobile first: 16px side gutters with safe-area insets, no horizontal scroll, works in
  standalone (Home Screen) mode with a black-translucent status bar.
- No emojis anywhere in the UI.
- The disclaimer (`DISCLAIMER` in `model/copy.ts`, rendered by `Disclaimer` in `views/Header.tsx`)
  must appear in onboarding, on the dose forms (add sheet), and at the bottom of the dashboard.
  Current text: "Bloodstream is made only for Adderall (mixed amphetamine salts, IR and XR) and its
  generic versions, for people keeping track of their ADHD treatment. Its curves, zones and articles
  are estimates built from published averages, not measurements of your body, and they can be
  wrong. It doesn't replace your doctor or pharmacist: check anything important with them, and
  never use Bloodstream to plan or change doses your prescriber hasn't approved."
  The incognito view intentionally omits it (no medical wording allowed there).
- Never add features that suggest or optimize doses. The app describes logged doses only.
  Logging guidance may tell people to contact a prescriber, stop until they do (serious
  suggestions), or get emergency care; it never proposes a different dose.

## Pharmacology model (sources and choices)

- Mixed salts are 3:1 d- to l-amphetamine; each enantiomer is modeled separately.
- Elimination half-lives (FDA label), by age group selected in onboarding:
  adults d 10 h / l 13 h; teens 13–17 d 11 h / l 13.5 h; children 6–12 d 9 h / l 11 h.
  65+ (`senior`) uses adult values; the label says older adults were not studied.
- IR: one-compartment, first-order absorption ka = 0.95/h, giving Tmax ≈ 3 h (label: ~3 h).
- XR: two bead populations, 50% immediate (ka 0.95) + 50% delayed 3 h (ka 0.4), giving
  Tmax ≈ 6.8 h (label: ~7 h, ~4 h later than IR; XR 20 mg ≈ IR 10 mg twice, 4 h apart).
- Linear, dose-proportional kinetics (label: exposure ~3x from 10 to 30 mg; MAS XR study:
  linear 20–60 mg), so multiple doses superpose. Doses count for 72 h (~1% left), then drop out
  of the model but stay in history. With label averages roughly a quarter of yesterday's dose
  remains next morning; personal factors change that (`carryOver24`).
- Sex: the label reports no direct effect; women's 20–30% higher exposure shrank once doses were
  normalized per kg. Sex is not a model input; it only shows the cycle and pregnancy options.
  Weight is an optional input (see Personal factors).
- Felt effect = plasma level delayed 30 min, times a logistic taper centered at
  4.2 + 0.05·mg h (IR) or 7.6 + 0.09·mg h (XR), normalized per dose. Calibrated to commonly
  reported durations (IR 4–6 h, XR 8–12 h); models acute tolerance. Stacked effects are summed
  (capped at 100%), which may overstate a late booster. Say so in the UI.
- "Left" = remaining mg ÷ (today's taken mg + carry-over at the start of today).
- Blood level % = relative to the peak of the largest dose in today's session (can exceed 100%).
- Sleep interference = 0.55·effect + 0.45·smoothstep(0.45, 1.0, level). A rough index.
- Effectivity zones: seven bands with upper edges 6/18/34/52/70/86/100% (`lib/zones.ts`). Tiers
  for adaptive article sections: low = zones 1–3, mid = 4–5, high = 6–7.

### Personal factors (4.1, `model/physio.ts`)
Only effects with published numbers move the curve. Everything else widens the range band or is a
note. Each factor carries a confidence tag (label / study / estimate / note) shown in the UI.
- Half-life multiplier `hl` = weight × urine pH × kidneys, clamped 0.7–3.0, applied to both
  enantiomers. Range `hlRange` evaluates the same doses at faster/slower clearance.
- Urine pH: `1 + 0.7·ΔpH` (≈7 h of half-life per pH unit; Änggård 1970, Gunne & Änggård 1973),
  clamped 0.7–2.5. Mostly plant-based diet +0.5 pH (Penczynski 2022: 6.7 vs 6.2) → ×1.35.
  Urine-alkalinizing medicine: assumed +1.0 pH (0.5–1.8) → ×1.7. Acidifying: −0.5 (−0.75 to −0.25).
  Range from the omnivore urine pH IQR (5.9–6.4, ±0.25 pH → ×0.825–1.175).
- Kidneys: d-amphetamine clearance 0.7 → 0.4 (severe, GFR 15–29) → 0.3 L/h/kg (kidney failure;
  Vyvanse label) → ×1.75 / ×2.333. Mild and moderate have no data: range +15% only.
- Weight: t½ × (W/Wref)^0.25 (allometry, Anderson 1997; label: t½ rises with weight), clamped
  0.8–1.25. Wref: child 30, teen 55, adult/senior 70 kg. Unknown weight widens the range (×0.92/1.09).
- ng/mL: XR 20 mg in a 70 kg adult peaks at 36.8 ng/mL total (28.1 d + 8.7 l), scaled by 70/W,
  ×0.7 for children (label: 30% less exposure per mg/kg). Readout range adds ±25% (CV 22–29%).
- XR absorption: high-fat meal (`dose.meal = 'highfat'`) adds 2.55 h lag to both bead populations
  and shifts the felt-effect taper by the same amount (label: Tmax +2.5 h d / +2.7 h l, extent
  unchanged). Daily PPI: delayed beads start at 1.5 h instead of 3 h (label 7.7: median Tmax −1.25 h
  d / −2.5 h l, AUC and Cmax unchanged). IR is never shifted (food effect not studied).
- Senior (65+) uses adult half-lives (label: not studied) with range +15%. CYP2D6 inhibitors and
  liver disease: range +20%. Pregnancy: range ×0.85 low / +15% high.
- Information only: menstrual cycle phase (White 2002, Justice & de Wit 2000; evidence limited, not
  in ADHD treatment), serotonergic medicines (serotonin syndrome warning), MAOI (contraindicated
  within 14 days; red card on the dashboard), caffeine/alcohol/cannabis/nicotine, sleep, stress.
- Never phrase any of this as advice to change diet, supplements or medicines to alter Adderall's
  effect. The UI says so ("Describe, don't adjust").

Sources:
- FDA label, Adderall XR: https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/021303s038lbl.pdf
- FDA label, Adderall tablets: https://www.accessdata.fda.gov/drugsatfda_docs/label/2015/011522s042lbl.pdf
- Amphetamine label (sex, weight, age): https://medlibrary.org/lib/rx/meds/amphetamine/page/6/
- MAS XR single/multiple-dose PK in adults (CNS Spectrums): https://www.cambridge.org/core/journals/cns-spectrums/article/abs/single-and-multipledose-pharmacokinetics-of-an-oral-mixed-amphetamine-salts-extendedrelease-formulation-in-adults/D9FA01A81133B15E9E1A22296F26E0D7
- Adderall XR label 12.3 (food, weight, half-lives, kidneys): https://medlibrary.org/lib/rx/meds/adderall-xr/page/5/
- Adderall XR label 7.7 (omeprazole): https://medlibrary.org/lib/rx/meds/adderall-xr-1/page/3/
- Vyvanse label (d-amphetamine clearance in ESRD): https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/021977s052lbl.pdf
- Urine pH and half-life: Änggård 1970 https://link.springer.com/article/10.1007/BF00560284 ;
  Gunne & Änggård 1973 https://link.springer.com/article/10.1007/BF01059787
- Diet and urine pH: Penczynski 2022 https://mdpi-res.com/d_attachment/nutrients/nutrients-14-04468/article_deploy/nutrients-14-04468.pdf
- Allometry: Anderson, McKee & Holford 1997 https://pubmed.ncbi.nlm.nih.gov/9391745/
- Every source is also in `src/content/sources.ts`.

## Data and storage

- Everything is local to the device. Nothing is uploaded. No analytics.
- IndexedDB database `bloodstream` v2:
  - v1 stores: `doses` (keyPath `id`, index `at`) and `kv` (`profile`, `settings`, `flag:*`).
  - v2 adds `meds`, `schedules`, `logs`, `appointments` (keyPath `id`).
  Full history is kept; nothing auto-deletes.
  - 4.1 added optional fields without a version bump: `profile.body` (Body: weightKg, units, sex,
    renal, diet, urine, ppi, cyp2d6, serotonergic, maoi, liver, pregnant, cycle) and `dose.meal`.
    `sanitizeBody` fills defaults for profiles saved before 4.1; importing an older backup keeps
    the device's body details.
- Schema changes: bump `DB_VERSION` in `storage.ts` and add an `if (oldVersion < N)` block.
  Never edit earlier blocks. Keep every `sanitize*` accepting older shapes. The upgrade waits
  (instead of falling back) when another tab blocks it, and an old tab reloads itself.
- Fallbacks: localStorage record `bloodstream.v3`, then memory (shown in Data & information controls).
- `migrateLegacy()` imports data from the old single-file builds (v1 cookie `bs_dose`,
  v2 localStorage `bloodstream` / cookie `bs2`) once, on the same origin.
- Backups: JSON `{ app: "bloodstream", format: 2, ... }` with every collection. Format 1 files
  still import (missing collections default to empty). Export uses the share sheet on touch
  devices, a download elsewhere. Import merges by id.
- Per-viewer conveniences in localStorage (safe to lose): reader text size (`bs.readerSize`),
  auto-surfaced schedule slots (`bs.surfaced`).
- iPhone notes: the Home Screen app has its own storage, separate from Safari, and is exempt
  from Safari's 7-day script-storage cap while it is being used. Deleting the icon deletes its
  data, hence the backup feature. `navigator.storage.persist()` is requested after the first dose.
- There is no restart button. Full resets go through Data & information controls > Delete all
  data, which also brings back first-visit onboarding. `settings.resetAt` is legacy and ignored.

## Behaviors worth knowing

- Onboarding (first entry or after Delete all data) has 8 pages: scope and disclaimer, how it
  works, name + age group + optional weight, the medication (saved as a Med, with the pill customizer), schedule +
  reminders, doctor logging (phase question), privacy and appearance, and today's dose (taken /
  plan / not today). Nothing is saved until the last page.
- People upgrading from 3.x get `settings.setupV4 = 'pending'`: a "New in version 4" card and
  a short tour (save last dose as a medication, name, logging, background).
- Top bar, right to left: incognito (always), log (when doctor logging is on), add, clock.
- Greeting header: date, "Good morning/afternoon/evening[, name]" ("Still up?" late), and a line
  that follows the curve phase.
- Add sheet (plus): Log a dose (saved meds with Take now / Other time with day chips, or a
  one-off dose that can be saved) and Medications (saved meds, schedules, reminders, Calendar
  export). Doses logged from a saved med carry `medId`; schedule-linked ones carry `scheduleId`
  and show a Scheduled tag.
- Schedule slots: upcoming (within the reminder lead), due (0–2 h), missed (2–8 h). Due cards
  sit above the hero; a due slot auto-opens the add sheet once. Taken = linked dose that day, or
  the same med (or kind+mg) within 3 h. "Skip today" stores `scheduleId|YYYY-MM-DD`.
- Reminders: in-app timers + service-worker notifications while the app is alive, plus an .ics
  export for reliable alerts. iOS web apps can't schedule notifications while closed without a
  push server, and the UI says so.
- Doctor logging: type tile, category, suggestion dropdown (picking one collapses the custom
  title box), additional information, guidance panel, priority. Library viewer: Entries
  (expand, linked article, edit, bulk select delete, share as text), Articles (sections,
  search over titles/headers), Appointments (add/edit, Calendar export).
- Appointments within 30 days show a banner under the hero; for 14 days after, a review banner
  links to clearing entries, editing medications, and exporting before a reset.
- Reader: full-screen, text size toggle, linked-entry banner, sources, related. Area articles
  start with a live panel (zone, meter, today's curve for that area, next zone change) and
  swap their strategy sections by tier.
- Incognito: `settings.incognitoUntil` (0 off, -1 until turned off, else end time) so it
  survives closing the app. Shows only a neutral rhythm graph, words like Rising / Steady /
  Easing, one percentage, and neutral key times. Hides the pill, doses, calendar, logging,
  name and backgrounds.
- Backgrounds: `settings.theme` (effect, colors, dim, motion, location). Shaders render at
  reduced resolution, about 30 fps, pause when hidden and honor reduced motion. The sky uses
  solar position from a rounded location (or the time zone) plus a moon phase.
- Calendar: dots for doses, a marker for appointments, "Scheduled:" rows on future days
  (schedules don't add dots). Past days can get added doses (RetroDose).
- Changelog: a single line under the disclaimer opens the full history page.
- Body & medicines (`personalizeOpen`): opened from Data & information controls and the caption
  under the curve. Live summary (half-lives, range, 24 h carry-over, typical-vs-you XR curve),
  factor list with confidence tags, inputs, "What Bloodstream doesn't model", sources. Cycle and
  pregnancy options appear for female/other. Hidden in incognito.
- Curve: shaded typical range (`levelAt(ts, hlRange[i])`), ng/mL line (`ngAt`), caption naming
  the factors that move the curve. XR doses get a "With a high-fat meal" switch in the dose form,
  Other time, RetroDose and DoseList Edit (`setDoseMeal`).

## Roadmap ideas (not built yet)

- Per-day curves inside the calendar viewer (tap a past day to replay its curve).
- Daily summary and simple trends (typical dose time, typical bedtime interference).
- Push-based reminders (would need a server; currently in-app + Calendar export).
- Linking log entries to doses and showing them on the curve.
- CSV export alongside the JSON backup.
