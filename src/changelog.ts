/**
 * Release history, shown at the bottom of the dashboard.
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

export const APP_VERSION = '3.2.0';

export const CHANGELOG: Release[] = [
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
