# Bloodstream

A personal, local-first web app that tracks Adderall (mixed amphetamine salts, IR and XR):
where a dose is in the bloodstream right now, how strong it likely feels, sleep interference
at a planned bedtime, and effect summaries across ADHD-related areas of functioning.
Owner: Rauf (crsor-a). Primary device: iPhone, installed to the Home Screen.

## Commands

- `npm run dev` start the dev server
- `npm test` run the Vitest suites (model, storage, time). Run before every commit.
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
  model/pk.ts        single-dose pharmacokinetics (pure functions)
  model/regimen.ts   multi-dose superposition, phases, key times, sleep index
  model/copy.ts      all effectivity, phase and sleep wording
  model/types.ts     Dose, PillLook, Profile, Settings
  lib/storage.ts     IndexedDB store, fallbacks, legacy import, backup format
  lib/time.ts        formatting and clock-time resolution rules
  lib/pill.ts        pill SVG builder + fade line
  state.ts           signals + every action that mutates data (single write path)
  views/             Onboarding, DoseForm, Dashboard, DoseList, Curve, Sleep, Effectivity, DataCard
  components/        Segmented, Switch, Sheet, ActionSheet, Toast
  styles/app.css     the whole design system (tokens at the top)
tests/               Vitest; fake-indexeddb for storage
public/              icons: plain white teardrop on black, same shape as the top-bar brand mark
```

Rules of the road:
- UI never writes to storage directly. Add an action in `state.ts`.
- Model code stays pure and unit-tested. If you change a constant in `pk.ts`, the label-anchor
  tests in `tests/pk.test.ts` must still pass (IR Tmax ≈ 3 h, XR ≈ 7 h, half-lives by age).
- Copy lives in `model/copy.ts`, not inline in components, except one-off labels.

## Design rules (keep these)

- Apple / SwiftUI feel: pitch-black background (#000), iOS inset-grouped cards (#1c1c1e),
  segmented controls, switches, bottom sheets, action sheets, toasts. System SF font stack.
- **White is the only accent.** No red/pink accents. Semantic colors are allowed only for
  information: the sleep severity gauge (green to red) and destructive actions (#ff453a).
- The customizable pill is the hero. After logging, the pill flies to the center and a white
  line sweeps down through it to the share remaining; everything above the line is ghosted.
- Mobile first: 16px side gutters with safe-area insets, no horizontal scroll, works in
  standalone (Home Screen) mode with a black-translucent status bar.
- No emojis anywhere in the UI.
- The disclaimer must appear on the dose form and at the bottom of the dashboard, verbatim:
  "Bloodstream is not a replacement for doctor advice and information shown may be inaccurate.
  Always double-check and never use this website to plan doses not approved by a healthcare
  professional."
- Never add features that suggest or optimize doses. The app describes logged doses only.

## Pharmacology model (sources and choices)

- Mixed salts are 3:1 d- to l-amphetamine; each enantiomer is modeled separately.
- Elimination half-lives (FDA label), by age group selected in onboarding:
  adults d 10 h / l 13 h; teens 13–17 d 11 h / l 13.5 h; children 6–12 d 9 h / l 11 h.
- IR: one-compartment, first-order absorption ka = 0.95/h, giving Tmax ≈ 3 h (label: ~3 h).
- XR: two bead populations, 50% immediate (ka 0.95) + 50% delayed 3 h (ka 0.4), giving
  Tmax ≈ 6.8 h (label: ~7 h, ~4 h later than IR; XR 20 mg ≈ IR 10 mg twice, 4 h apart).
- Linear, dose-proportional kinetics (label: exposure ~3x from 10 to 30 mg; MAS XR study:
  linear 20–60 mg), so multiple doses superpose. Doses count for 72 h (~1% left), then drop out
  of the model but stay in history. Roughly a quarter of yesterday's dose remains next morning.
- Sex: the label reports no direct effect; women's 20–30% higher exposure is attributed to body
  weight, which changes absolute levels, not the shape of these normalized curves. So sex and
  weight are intentionally not inputs.
- Felt effect = plasma level delayed 30 min, times a logistic taper centered at
  4.2 + 0.05·mg h (IR) or 7.6 + 0.09·mg h (XR), normalized per dose. Calibrated to commonly
  reported durations (IR 4–6 h, XR 8–12 h); models acute tolerance. Stacked effects are summed
  (capped at 100%), which may overstate a late booster. Say so in the UI.
- "Left" = remaining mg ÷ (today's taken mg + carry-over at the start of today).
- Blood level % = relative to the peak of the largest dose in today's session (can exceed 100%).
- Sleep interference = 0.55·effect + 0.45·smoothstep(0.45, 1.0, level). A rough index.

Sources:
- FDA label, Adderall XR: https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/021303s038lbl.pdf
- FDA label, Adderall tablets: https://www.accessdata.fda.gov/drugsatfda_docs/label/2015/011522s042lbl.pdf
- Amphetamine label (sex, weight, age): https://medlibrary.org/lib/rx/meds/amphetamine/page/6/
- MAS XR single/multiple-dose PK in adults (CNS Spectrums): https://www.cambridge.org/core/journals/cns-spectrums/article/abs/single-and-multipledose-pharmacokinetics-of-an-oral-mixed-amphetamine-salts-extendedrelease-formulation-in-adults/D9FA01A81133B15E9E1A22296F26E0D7

## Data and storage

- Everything is local to the device. Nothing is uploaded. No analytics.
- IndexedDB database `bloodstream` v1: `doses` (keyPath `id`, index `at`) and `kv`
  (`profile`, `settings`, `flag:*`). Full history is kept; nothing auto-deletes.
- Schema changes: bump the version in `openStore()` and add an `if (oldVersion < N)` block.
  Never edit earlier blocks. Keep `sanitizeDose` accepting every older shape.
- Fallbacks: localStorage record `bloodstream.v3`, then memory (shown in the Your data card).
- `migrateLegacy()` imports data from the old single-file builds (v1 cookie `bs_dose`,
  v2 localStorage `bloodstream` / cookie `bs2`) once, on the same origin.
- Backups: JSON `{ app: "bloodstream", format: 1, ... }`. Export uses the share sheet on touch
  devices, a download elsewhere. Import merges by dose id. Bump `BACKUP_FORMAT` only for
  breaking changes and keep reading older formats.
- iPhone notes: the Home Screen app has its own storage, separate from Safari, and is exempt
  from Safari's 7-day script-storage cap while it is being used. Deleting the icon deletes its
  data, hence the backup feature. `navigator.storage.persist()` is requested after the first dose.
- "Start over" sets `settings.resetAt`: earlier doses leave the model but stay in history.

## Behaviors worth knowing

- Onboarding page 2 asks every time: IR/XR, mg, time (or "Not taken yet" to plan ahead),
  age group, and the pill customizer (capsule / round / oval; whole or two-tone; 11 swatches,
  "clear" beads, custom color).
- Planned doses show the full curve and an "I took it now" button; tracking flips to live on
  its own at the planned time.
- Time correction (Doses list → Edit) only saves times that already happened; it resolves to
  the past occurrence nearest the dose's current time (`resolvePast`).
- The plus button opens a sheet with the same form to add a stacked dose.
- The dashboard skips onboarding while any tracked dose is within the last 24 h.

## Roadmap ideas (not built yet)

- History view (calendar or list of past days, per-day curves) using the stored history.
- Daily summary and simple trends (typical dose time, typical bedtime interference).
- Optional local notifications (e.g. "planned dose time") for installed web apps (iOS 16.4+).
- Notes per dose (sleep quality, meals) to correlate with how a day felt.
- CSV export alongside the JSON backup.
