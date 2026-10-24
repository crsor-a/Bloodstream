import type { Band } from './pk';
import type { Phase } from './regimen';

export const PHASES: Record<Phase, [string, string]> = {
  pre: ['Not taken yet', 'This time is before the dose.'],
  onset: ['Kicking in', 'Absorption is underway and effects are starting to show.'],
  build: ['Building', 'Levels are climbing toward their high point.'],
  peak: ['Peak', 'Effects are at or near their strongest.'],
  plateau: ['Holding', 'Past the high point but still well inside the active window.'],
  taper: ['Tapering', 'Effects are fading steadily.'],
  comedown: ['Comedown', 'Most of the effect has worn off. Rebound symptoms are most likely in this window.'],
  residual: ['Worn off', 'Felt effects are gone, though some medication is still being cleared.']
};

export function feelPhrase(e: number): string {
  if (e < 0.05) return 'your usual unmedicated baseline';
  if (e < 0.2) return 'a faint background hum';
  if (e < 0.4) return 'a light lift';
  if (e < 0.65) return 'steady, workable focus';
  if (e < 0.85) return 'clear, dialed-in focus';
  return 'the full-strength stretch';
}
export const DIRECTION: Partial<Record<Phase, string>> = {
  onset: 'and still climbing', build: 'and still climbing', peak: 'right around its high point',
  plateau: 'holding just off the top', taper: 'and easing off', comedown: 'and easing off'
};

export interface SleepBand { max: number; name: string; color: string; text: string }
/** Severity colors are semantic (information), not accents. */
export const SLEEP_BANDS: SleepBand[] = [
  { max: 10, name: 'Minimal', color: '#30d158', text: 'Very little stimulant activity is expected by then. Falling asleep should feel close to normal.' },
  { max: 25, name: 'Mild', color: '#ffd60a', text: 'You may take a little longer to drift off, but overall sleep quality should mostly hold up.' },
  { max: 45, name: 'Moderate', color: '#ff9f0a', text: 'Expect a noticeably longer time to fall asleep and lighter, more broken sleep early in the night.' },
  { max: 70, name: 'High', color: '#ff6b3d', text: 'Falling asleep on time is unlikely. Deep sleep and total sleep time may both take a hit.' },
  { max: 101, name: 'Severe', color: '#ff453a', text: 'Levels are still near their active range. Sleep is likely to be badly delayed or fragmented.' }
];
export const sleepBand = (i: number) => SLEEP_BANDS.find(b => i < b.max)!;

export interface EffCtx { E: number; L: number; I: number; rising: boolean; afterPeak: boolean }
type Kindish = 'focus' | 'appetite' | 'body' | 'sleep';
export interface EffItem { name: string; kind: Kindish; value: (c: EffCtx) => number; text: (c: EffCtx, p: Phase) => string }

const byPhase = (t: Partial<Record<Phase, string>>) => (_: EffCtx, p: Phase) => t[p] ?? '';

function appetiteText(l: number) {
  if (l >= 0.85) return 'Appetite is most suppressed. Plan a meal anyway, even a small one.';
  if (l >= 0.6) return 'Hunger is still muted while levels stay high. A reminder to eat is worth setting.';
  if (l >= 0.35) return 'Appetite is slowly coming back. Hunger often returns strongly in the evening.';
  if (l >= 0.15) return 'Appetite is mostly back. A good time for a real meal.';
  return 'Appetite should be close to normal.';
}
function bodyText(l: number) {
  if (l >= 0.85) return 'Physical stimulation is near its highest. A faster pulse or dry mouth is common.';
  if (l >= 0.6) return 'Heart rate and blood pressure are likely still raised. Keep drinking water.';
  if (l >= 0.35) return 'Physical effects are easing, but a fair amount is still circulating.';
  if (l >= 0.12) return 'Mostly settled. Small physical effects may linger.';
  return 'Physical effects are minimal.';
}
function sleepText(i: number) {
  if (i < 10) return 'Little to no expected effect on falling asleep.';
  if (i < 25) return 'Sleep would come, maybe a bit slower than usual.';
  if (i < 45) return 'Falling asleep would likely take a while.';
  if (i < 70) return 'Sleep would be hard to reach right now.';
  return 'Too stimulated for sleep at this level.';
}

export function levelWord(kind: Kindish, v: number, i: number): string {
  if (kind === 'appetite') return v < 0.12 ? 'Normal appetite' : v < 0.35 ? 'Slightly reduced' : v < 0.6 ? 'Reduced' : v < 0.85 ? 'Low appetite' : 'Very low appetite';
  if (kind === 'body') return v < 0.12 ? 'Settled' : v < 0.35 ? 'Mild' : v < 0.6 ? 'Noticeable' : v < 0.85 ? 'Elevated' : 'High';
  if (kind === 'sleep') return i < 10 ? 'Ready' : i < 25 ? 'Mostly ready' : i < 45 ? 'Delayed' : i < 70 ? 'Unlikely' : 'Blocked';
  return v < 0.08 ? 'Baseline' : v < 0.3 ? 'Light' : v < 0.55 ? 'Partial' : v < 0.8 ? 'Solid' : 'Strong';
}

export const EFFECT_GROUPS: { group: string; items: EffItem[] }[] = [
  { group: 'Attention', items: [
    { name: 'Focus', kind: 'focus', value: c => c.E, text: byPhase({
      onset: 'Focus is just starting to come online. Short, easy tasks make a good warm-up.',
      build: 'Attention is getting easier to hold. A good moment to open the hardest task.',
      peak: 'Sustained attention is at its strongest. Long reading or deep work fits here.',
      plateau: 'Focus is holding steady. Keep the big task going while it lasts.',
      taper: 'Attention is loosening. Short breaks between chunks stretch it further.',
      comedown: 'Focus is close to baseline. Stick to routine or low-stakes work.',
      residual: 'Medication focus support has largely faded.' }) },
    { name: 'Getting started', kind: 'focus', value: c => Math.min(1, c.E * (c.rising ? 1.08 : 0.94)), text: byPhase({
      onset: 'Starting still takes effort. Pick one tiny first step and ride the rise.',
      build: 'Starting things feels less like pushing a boulder. Line up your list.',
      peak: 'Starting is easiest now. Tackle the task you have been avoiding.',
      plateau: 'Still easy to begin new things, though switching may feel slower.',
      taper: 'New tasks need more of a push. Finish what is open before starting fresh.',
      comedown: 'Getting going is hard again. Timers or working beside someone help.',
      residual: 'Starting tasks is back near your unmedicated baseline.' }) },
    { name: 'Working memory', kind: 'focus', value: c => c.E * 0.94, text: byPhase({
      onset: 'Holding several steps in mind is still shaky. Write things down.',
      build: 'Juggling details is improving. Multi-step problems are getting easier.',
      peak: 'Working memory is at its best. Good for mental math, planning and long instructions.',
      plateau: 'Still holding details well. Lists help keep it that way.',
      taper: 'Details start slipping more easily. Note down anything important.',
      comedown: 'Expect to lose your train of thought more often. Lean on notes and reminders.',
      residual: 'Working memory support has mostly worn off.' }) },
    { name: 'Time awareness', kind: 'focus', value: c => c.E * 0.85, text: byPhase({
      onset: 'Time can still slip by unnoticed. Set a timer for anything important.',
      build: 'Your sense of time is sharpening and estimates get more realistic.',
      peak: 'Best time tracking of the dose, though hyperfocus can still swallow an hour.',
      plateau: 'Time sense is steady. Watch for getting locked onto one task.',
      taper: 'Time starts to blur again. Alarms for evening plans are a good idea.',
      comedown: 'Time blindness is close to baseline. Lean on clocks and reminders.',
      residual: 'Time awareness is back to your usual tools and habits.' }) }
  ] },
  { group: 'Self-regulation', items: [
    { name: 'Impulse control', kind: 'focus', value: c => c.E, text: byPhase({
      onset: 'Impulses are still quick. Pause before replying or buying anything.',
      build: 'The gap between thought and action is widening. Easier to stop and think.',
      peak: 'Impulse control is at its strongest point of the dose.',
      plateau: 'Still a solid pause button. Decisions feel more deliberate.',
      taper: 'The pause button is getting shorter. Save big decisions for later.',
      comedown: 'Impulsivity is returning. Adding friction, like closing tabs, helps.',
      residual: 'Impulse control is near your baseline.' }) },
    { name: 'Emotional steadiness', kind: 'focus', value: c => c.E * ((!c.rising && c.E < 0.55) ? 0.78 : 1), text: byPhase({
      onset: 'Mood is settling in. Some people feel a brief edge as it kicks in.',
      build: 'Frustration tolerance is improving as levels rise.',
      peak: 'Generally steady, though some people feel flat or a little tense at peak.',
      plateau: 'Emotional regulation is holding well.',
      taper: 'Patience may wear thin. Irritability can creep in as levels drop.',
      comedown: 'This is the classic rebound window. Low mood or snappiness is common and passes.',
      residual: 'Rebound effects have usually settled by now.' }) },
    { name: 'Calm body', kind: 'focus', value: c => c.E * 0.95, text: byPhase({
      onset: 'Fidgeting and restlessness are still around.',
      build: 'Physical restlessness is easing. Sitting still gets easier.',
      peak: 'Restlessness is at its lowest, though some people feel jittery at peak.',
      plateau: 'Body feels calmer and more settled.',
      taper: 'Fidgeting may start creeping back.',
      comedown: 'Restlessness is returning toward baseline. A short walk can help.',
      residual: 'Activity level is back to your usual.' }) },
    { name: 'Conversation', kind: 'focus', value: c => c.E * 0.9, text: byPhase({
      onset: 'Conversations may still drift, and interrupting is more likely.',
      build: 'Listening and turn-taking are getting easier.',
      peak: 'Easier to follow conversations. Some people feel quieter or more serious.',
      plateau: 'A good window for meetings, calls and group work.',
      taper: 'Attention in conversation starts to wander more.',
      comedown: 'Social energy may dip. Shorter replies and some irritability are normal.',
      residual: 'Your social style is back to baseline.' }) }
  ] },
  { group: 'Body', items: [
    { name: 'Energy', kind: 'focus', value: c => c.E, text: byPhase({
      onset: 'Energy is lifting gently.',
      build: 'Alertness is climbing. A good time for active tasks.',
      peak: 'Alertness is high. Adding coffee can tip it into feeling wired.',
      plateau: 'Energy is steady and reliable.',
      taper: 'Energy is fading and a slump may start to show.',
      comedown: 'Tiredness can hit as the stimulant wears off. A snack and water help.',
      residual: 'Alertness is back to natural levels.' }) },
    { name: 'Appetite suppression', kind: 'appetite', value: c => Math.pow(Math.min(1, c.L), 1.15), text: (c, p) =>
      !c.afterPeak && p === 'onset' ? 'Appetite is starting to drop. Eating now is easier than eating later.'
        : !c.afterPeak && p === 'build' ? 'Hunger cues are getting quieter.'
        : appetiteText(Math.min(1, c.L)) },
    { name: 'Physical stimulation', kind: 'body', value: c => Math.min(1, c.L), text: c => bodyText(c.L) },
    { name: 'Sleep readiness', kind: 'sleep', value: c => 1 - c.I / 100, text: c => sleepText(c.I) }
  ] }
];

/** Article id for each effectivity area (articles live in src/content/articles). */
export const AREA_IDS: Record<string, string> = {
  'Focus': 'area-focus', 'Getting started': 'area-start', 'Working memory': 'area-memory', 'Time awareness': 'area-time',
  'Impulse control': 'area-impulse', 'Emotional steadiness': 'area-emotion', 'Calm body': 'area-calm', 'Conversation': 'area-social',
  'Energy': 'area-energy', 'Appetite suppression': 'area-appetite', 'Physical stimulation': 'area-body', 'Sleep readiness': 'area-sleep'
};
export const effItemByArea = (area: string) => {
  for (const g of EFFECT_GROUPS) for (const it of g.items) if (AREA_IDS[it.name] === area) return { group: g.group, item: it };
  return null;
};

/* ---------------- greetings (dashboard header) ---------------- */
export function greetingTitle(name: string, ts: number): string {
  const h = new Date(ts).getHours();
  const n = name.trim();
  if (h >= 23 || h < 4) return n ? `Still up, ${n}?` : 'Still up?';
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return n ? `${part}, ${n}` : part;
}

/** One line under the greeting that follows the day's curve. */
export function greetingLine(p: { phase: Phase | 'idle' | 'planned'; plannedAt?: string; hour: number }): string {
  switch (p.phase) {
    case 'idle': return p.hour < 12 ? 'Nothing in your system yet today.' : 'Nothing is being tracked right now.';
    case 'planned': return `Your dose is planned for ${p.plannedAt}.`;
    case 'pre': return 'Your next dose hasn\'t been taken yet.';
    case 'onset': return 'Your dose is just kicking in.';
    case 'build': return 'Building toward your best stretch.';
    case 'peak': return 'You\'re in your strongest window.';
    case 'plateau': return 'Holding steady.';
    case 'taper': return 'Easing off. Wrap up the big stuff.';
    case 'comedown': return 'Winding down. Go easy on yourself.';
    case 'residual': return p.hour >= 18 ? 'Mostly worn off. Time to wind down.' : 'Mostly worn off.';
  }
}

/** Incognito: neutral words with no medical meaning. */
export function rhythmWord(e: number, rising: boolean): string {
  if (e < 0.08) return 'Resting';
  if (rising) return e < 0.4 ? 'Rising' : 'Building';
  if (e >= 0.88) return 'High';
  if (e >= 0.6) return 'Steady';
  if (e >= 0.3) return 'Easing';
  return 'Low';
}

export const DISCLAIMER = 'Bloodstream is made only for Adderall (mixed amphetamine salts, IR and XR) and its generic versions, for people keeping track of their ADHD treatment. Its curves, zones and articles are estimates built from published averages, not measurements of your body, and they can be wrong. It doesn\'t replace your doctor or pharmacist: check anything important with them, and never use Bloodstream to plan or change doses your prescriber hasn\'t approved.';

/** Age groups. 65+ uses adult label values (older adults were not studied) with a wider range. */
export const BAND_OPTIONS: { v: Band; label: string }[] = [
  { v: 'child', label: '6–12' }, { v: 'teen', label: '13–17' }, { v: 'adult', label: '18–64' }, { v: 'senior', label: '65+' }
];
