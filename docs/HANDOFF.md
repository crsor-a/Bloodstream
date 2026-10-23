# Bloodstream handoff notes

Context carried over from the claude.ai sessions that built versions 1 through 4, so a new
Claude Code session can pick up without the old chat. `CLAUDE.md` holds the rules and the
architecture; this file holds the history, the reasoning behind decisions, and the workflow.

## Where things stand

- **Live:** 4.0.0 at https://crsor-a.github.io/Bloodstream/ (deployed from `main`).
- **Repo:** https://github.com/crsor-a/Bloodstream. A leftover branch `v4` exists on GitHub
  (the old session couldn't delete it). It's fully merged and safe to delete.
- **Owner:** Rauf. Primary device is an iPhone with the app installed to the Home Screen, so
  existing installs always have saved history that updates must keep.

## Standing instructions from Rauf (all versions)

- **Never lose or reset saved data.** Every update must keep existing IndexedDB data. Schema
  changes only add stores/fields, with a migration and a test that opens an old database.
- No emojis anywhere in the UI. White is the only accent color (semantic colors only for
  information; see CLAUDE.md).
- The app describes logged doses. It never suggests, optimizes or changes doses.
- He likes the Apple/SwiftUI look, likes being "blown away" visually, and wants things done
  thoroughly rather than minimally. He gives big multi-part specs and then reconvenes.
- Conversation style he prefers: casual, friendly, a bit verbose, no emojis.

## Release history in one paragraph each

- **1.x / 2.x:** single-file HTML builds (cookies, then localStorage). Customizable pill, live
  curve, sleep and effectivity, planning ahead, time correction, stacking, age groups.
- **3.0.0:** rebuild as Vite + Preact + TypeScript PWA with IndexedDB, backups, offline,
  tests. `migrateLegacy()` imports the old single-file data.
- **3.0.1:** white teardrop icon; icon files renamed so iOS caches can't serve the old one.
- **3.1.0:** dose calendar (week/month/year, full-screen viewer), changelog, sleep wording.
- **3.2.0:** add doses to past days from the calendar (RetroDose).
- **3.3.0:** removed the restart button; onboarding only on first entry or after Delete all data.
- **4.0.0:** saved medications, schedules, due check-ins, reminders + Calendar export;
  doctor logging (144 suggestions, guidance, library, 36 sourced articles, reader);
  appointments; seven-zone effectivity with adaptive area articles; incognito; WebGL living
  backgrounds with a glass UI; name greetings; Data & information controls; new disclaimer;
  changelog page; 8-page onboarding; upgrade tour for 3.x users. Storage v2.

## Decisions worth knowing (and why)

- **Inverted zone colors** for appetite suppression and physical stimulation: green means
  "settled", so a fully suppressed appetite isn't shown as green. Rauf asked for red-to-green
  on every bar; this was flagged to him as a judgment call.
- **"Stop" guidance wording:** Rauf's requested message ("Bloodstream recommends you
  discontinue use until you speak with your doctor...") is used for serious suggestions, but
  it does not claim to match the FDA Medication Guide, because the guide mostly says "call
  your doctor right away" rather than "stop". Emergencies say call 911 / 988 / Poison Control.
- **Reminders:** iOS web apps can't fire notifications while fully closed without a push
  server. So: in-app timers + service-worker notifications while alive, due cards, a one-time
  auto-opened add sheet for a due slot, and an .ics export to the Calendar app. The UI says this.
- **Incognito hides the add and log buttons** (those sheets show medication names and mg),
  turns off backgrounds and the name, and omits the disclaimer (no medical words allowed).
- **Glass UI only with a background effect.** With "Black", bars are solid (Rauf disliked
  content smearing under translucent bars on pure black).
- **Article sources:** most URLs were opened and checked. Not verifiable from the old sandbox
  and worth a manual check: NEJM psychosis study, the two DOI links (Cowan; Melby-Lervåg),
  TSA travel tips, askjan.org.
- **Living sky:** sun position from NOAA equations using a location rounded to ~10 km (or a
  time-zone guess); the moon is placed where the sun was `phase × ~24.8 h` earlier, which
  rises and sets at believable times for its phase.

## Workflow that worked

1. Read the relevant files first; keep model code pure and add tests with any logic change.
2. `npm test` and `npm run build` before every commit (the deploy workflow runs both too).
3. Visual QA with the scripts in `scripts/qa/` (see its README). Review contact sheets of
   screenshots rather than single images. Shaders render in headless Chromium via SwiftShader.
4. For any storage change, run `scripts/qa/upgrade.py` against the previous release's build
   and confirm the doses, profile and settings survive.
5. Release: changelog entry at the top of `src/changelog.ts`, `APP_VERSION`, `package.json`.
   Patch for polish, minor for features, major for storage changes.
6. Push to `main` deploys. Check the run with
   `gh run list --limit 3` or `curl -s https://api.github.com/repos/crsor-a/Bloodstream/actions/runs?per_page=3`.

Gotchas from the old environment: don't `pkill -f "vite preview"` (it matched and killed the
shell running it); start a new preview on another port instead. When serving builds with
Python's http.server for upgrade tests, touch file mtimes or the server answers 304 with old files.

## Ideas Rauf hasn't asked for yet (roadmap in CLAUDE.md)

Per-day curves in the calendar, trends, push reminders (needs a server), linking log entries
to doses on the curve, CSV export. Real-device testing of the backgrounds on his iPhone is the
most useful next check (performance and how the glass reads in daylight sky).
