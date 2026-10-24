/**
 * Release history, shown on its own page from the line under the disclaimer.
 *
 * Versioning: MAJOR.MINOR.PATCH
 *   MAJOR  a rebuild, or any change to how saved data is stored (always ships with a migration
 *          that keeps existing data)
 *   MINOR  new features
 *   PATCH  fixes and visual polish
 *
 * To release: add an entry at the TOP, set APP_VERSION to match, and bump package.json.
 * Users who haven't seen the newest entry get an "Updated" toast and a NEW badge.
 */
export type ChangeType = 'new' | 'improved' | 'fixed';
export interface Change { type: ChangeType; text: string }
export interface Release { version: string; date: string; title: string; changes: Change[] }

export const APP_VERSION = '4.1.0';

export const CHANGELOG: Release[] = [
  {
    version: '4.1.0', date: '2026-10-24', title: 'A curve that fits you',
    changes: [
      { type: 'new', text: 'Body & medicines: optional weight, kidney function, diet, regular medicines and health details that personalize how fast each dose is absorbed and cleared. Only effects with published numbers move the curve, and each one is tagged with where its numbers come from.' },
      { type: 'new', text: 'Your curve now shows a shaded typical range, and an estimate of amphetamine in your blood in ng/mL, calibrated to the Adderall XR label and your weight.' },
      { type: 'new', text: 'Mark an XR dose as taken with a high-fat meal, when you log it or later with Edit. Its peak moves about 2.5 hours later, as on the label.' },
      { type: 'new', text: 'A 65+ age group, an optional weight step in setup, and an optional cycle phase note that is shown for information only.' },
      { type: 'new', text: 'New article: What shapes your curve. Safety notes for MAOIs and serotonergic medicines when you mark them.' },
      { type: 'improved', text: 'Carry-over into the next day now follows your own clearance instead of a fixed estimate. Your history and settings are untouched.' }
    ]
  },
  {
    version: '4.0.0', date: '2026-10-22', title: 'Bloodstream 4',
    changes: [
      { type: 'new', text: 'Saved medications: log your usual dose with one tap, or at any other time and day.' },
      { type: 'new', text: 'Schedules for weekdays, weekends or any days you choose, with check-ins when a dose is due, reminders, and a one-tap export to the Calendar app for alerts when Bloodstream is closed.' },
      { type: 'new', text: 'Doctor logging: note side effects, benefits, questions and concerns from over 140 suggestions, each with guidance and a linked article. Serious ones say clearly when to call or get help.' },
      { type: 'new', text: 'Logging library with your entries, appointments and 36 articles written from the FDA label and other medical sources, in a dedicated reader with charts and visuals.' },
      { type: 'new', text: 'Appointments show on your calendar, and the dashboard reminds you to start noting things a few weeks ahead, then helps you tidy up afterward.' },
      { type: 'new', text: 'Effectivity now uses seven color-coded zones, and every area opens an article that adapts to the zone you\'re in right now.' },
      { type: 'new', text: 'Incognito: a neutral screen with no medical words, for as long as you choose, even if you close the app.' },
      { type: 'new', text: 'Appearance: a living sky that follows the sun where you are, aurora, rain on glass, snowfall, nebula, or your own colors, with a translucent interface.' },
      { type: 'new', text: 'Greetings that change through the day, with your name if you add one in Data & information controls.' },
      { type: 'improved', text: 'A new welcome that sets up your medication, schedule, logging and privacy in one pass.' },
      { type: 'improved', text: 'Clearer fine print, and this changelog now lives on its own page.' },
      { type: 'improved', text: 'Your existing doses and settings carry over untouched. Backups now include medications, schedules, logs and appointments.' }
    ]
  },
  {
    version: '3.3.0', date: '2026-10-21', title: 'Simpler start',
    changes: [
      { type: 'improved', text: 'The welcome screens only appear on your first visit. After that, Bloodstream always opens to your dashboard.' },
      { type: 'improved', text: 'Removed the restart button. To erase everything, use Delete all data in Your data.' },
      { type: 'new', text: 'Change your age group anytime in Your data.' },
      { type: 'new', text: 'When nothing has been taken in the last few days, the dashboard says so and offers Log a dose, with your calendar still in reach.' }
    ]
  },
  {
    version: '3.2.0', date: '2026-10-21', title: 'Past doses',
    changes: [
      { type: 'new', text: 'Add a dose to any earlier day from the full-screen calendar. It fills in your most recent dose, so you only set the time, and it works for days before you started using Bloodstream.' },
      { type: 'new', text: 'Doses from the last few days that are still in your system are added to your curve, sleep and effectivity right away.' },
      { type: 'new', text: 'Tap a dose in the calendar\'s day details to remove it.' },
      { type: 'fixed', text: '12.5 mg doses no longer show as 13 mg.' }
    ]
  },
  {
    version: '3.1.0', date: '2026-10-21', title: 'Dose calendar',
    changes: [
      { type: 'new', text: 'Dose calendar with week, month and year views. Dots are color-coded when you log more than one kind of dose, and white when every dose is the same.' },
      { type: 'new', text: 'Full-screen calendar with day-by-day details and stats for the week, month or year.' },
      { type: 'new', text: 'This changelog, with a badge when something new arrives.' },
      { type: 'improved', text: 'The sleep card header now reads "Mild interference" and the gauge shows just the percentage.' }
    ]
  },
  {
    version: '3.0.1', date: '2026-10-21', title: 'New icon',
    changes: [
      { type: 'improved', text: 'Plain white teardrop app icon, matching the drop in the top bar.' },
      { type: 'fixed', text: 'The Home Screen icon no longer gets stuck on an old cached version.' }
    ]
  },
  {
    version: '3.0.0', date: '2026-10-21', title: 'Rebuilt from the ground up',
    changes: [
      { type: 'new', text: 'Your full dose history is saved on this device in a real database.' },
      { type: 'new', text: 'Export and import backups, so a new phone or deleted icon doesn\'t lose anything.' },
      { type: 'new', text: 'Works offline and installs to the Home Screen as an app.' },
      { type: 'improved', text: 'The medical math is checked by automated tests before every update.' },
      { type: 'improved', text: 'Start over stops tracking without deleting your history.' }
    ]
  },
  {
    version: '2.0.0', date: '2026-10-21', title: 'Planning and stacking',
    changes: [
      { type: 'new', text: 'Plan a dose ahead with Not taken yet, then tap I took it now.' },
      { type: 'new', text: 'Correct the time you actually took a dose.' },
      { type: 'new', text: 'Add stacked doses with the plus button; leftovers from earlier doses carry over.' },
      { type: 'new', text: 'Age group, which sets how fast the body clears the dose.' },
      { type: 'improved', text: 'White accents throughout and sturdier saving.' }
    ]
  },
  {
    version: '1.0.0', date: '2026-10-20', title: 'First release',
    changes: [
      { type: 'new', text: 'Customizable pill that fades as the dose clears.' },
      { type: 'new', text: 'Live dose curve with a draggable time dot.' },
      { type: 'new', text: 'Sleep interference and effectivity summaries.' }
    ]
  }
];
