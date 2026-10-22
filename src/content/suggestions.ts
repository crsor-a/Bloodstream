/**
 * Doctor-logging suggestions. Each one links to an article that covers it.
 * Urgency follows the FDA Medication Guide for Adderall / Adderall XR:
 *   emergency  call 911 / go to an emergency room now
 *   stop       stop taking it and contact the prescriber right away (Medication Guide wording)
 *   soon       contact the prescriber soon, not just at the next routine visit
 *   mention    bring it up at the next appointment
 *   info       good to know; track it if it matters to you
 */
import type { LogType, Urgency } from '../model/types';

export interface Category { id: string; label: string }
export const CATEGORIES: Category[] = [
  { id: 'sleep', label: 'Sleep' },
  { id: 'appetite', label: 'Appetite & weight' },
  { id: 'heart', label: 'Heart & blood pressure' },
  { id: 'stomach', label: 'Stomach & digestion' },
  { id: 'head', label: 'Headaches & dizziness' },
  { id: 'mood', label: 'Mood & emotions' },
  { id: 'anxiety', label: 'Anxiety & restlessness' },
  { id: 'focus', label: 'Focus & attention' },
  { id: 'energy', label: 'Energy & crash' },
  { id: 'motivation', label: 'Motivation & starting' },
  { id: 'social', label: 'Communication & social' },
  { id: 'thinking', label: 'Memory & thinking' },
  { id: 'movement', label: 'Tics & movements' },
  { id: 'circulation', label: 'Fingers, toes & circulation' },
  { id: 'body', label: 'Skin, hair, sweat & eyes' },
  { id: 'mouth', label: 'Mouth & teeth' },
  { id: 'sexual', label: 'Sexual & urinary health' },
  { id: 'growth', label: 'Growth & development' },
  { id: 'timing', label: 'Timing & duration' },
  { id: 'interactions', label: 'Food, drinks & other meds' },
  { id: 'safety', label: 'Safety & misuse' },
  { id: 'practical', label: 'Refills, school & work' },
  { id: 'other', label: 'Something else' }
];
export const categoryLabel = (id: string) => CATEGORIES.find(c => c.id === id)?.label ?? 'Something else';

export interface Suggestion {
  id: string;
  types: LogType[];
  cat: string;
  text: string;
  urgency: Urgency;
  article: string;
  /** Symptoms to watch for (stop / emergency). */
  watch?: string;
  /** What to do (stop / emergency). */
  action?: string;
  /** Replaces the standard guidance message. */
  note?: string;
}

const S = (id: string, types: LogType | LogType[], cat: string, text: string, urgency: Urgency, article: string, extra: Partial<Suggestion> = {}): Suggestion =>
  ({ id, types: Array.isArray(types) ? types : [types], cat, text, urgency, article, ...extra });

const CALL_911 = 'call 911 or go to the nearest emergency room now';

export const SUGGESTIONS: Suggestion[] = [
  /* Sleep */
  S('sleep-onset', 'effect', 'sleep', 'It takes me a long time to fall asleep', 'mention', 'sleep'),
  S('sleep-waking', 'effect', 'sleep', 'I wake up during the night', 'mention', 'sleep'),
  S('sleep-early', 'effect', 'sleep', 'I wake up too early and can\'t get back to sleep', 'mention', 'sleep'),
  S('sleep-dreams', 'effect', 'sleep', 'Vivid dreams or nightmares', 'info', 'sleep'),
  S('sleep-tired', 'effect', 'sleep', 'I\'m tired in the morning even after a full night', 'mention', 'sleep'),
  S('sleep-q-timing', 'question', 'sleep', 'Would taking it earlier help my sleep?', 'mention', 'sleep'),
  S('sleep-q-melatonin', 'question', 'sleep', 'Is it OK to use melatonin or a sleep aid?', 'mention', 'sleep'),
  S('sleep-b-better', 'benefit', 'sleep', 'I sleep better since starting', 'info', 'sleep'),
  S('sleep-c-enough', 'concern', 'sleep', 'I\'m worried I\'m not getting enough sleep', 'mention', 'sleep'),
  S('sleep-b-allnight', 'benefit', 'sleep', 'I can stay up all night working', 'mention', 'benefits', {
    note: 'This one is worth reporting rather than celebrating. Staying up through the night means the medication is still active at bedtime, and lost sleep wipes out much of the focus it gives you the next day.'
  }),

  /* Appetite & weight */
  S('app-low', 'effect', 'appetite', 'I\'m not hungry during the day', 'info', 'appetite'),
  S('app-skip', 'effect', 'appetite', 'I\'m skipping meals', 'mention', 'appetite'),
  S('app-weightloss', 'effect', 'appetite', 'I\'ve lost weight without trying', 'soon', 'appetite'),
  S('app-evening', 'effect', 'appetite', 'I\'m very hungry in the evening', 'info', 'appetite'),
  S('app-nausea-food', 'effect', 'appetite', 'Food makes me feel sick while it\'s active', 'mention', 'stomach'),
  S('app-q-eat', 'question', 'appetite', 'When should I eat around my dose?', 'info', 'appetite'),
  S('app-q-shakes', 'question', 'appetite', 'Should I use protein shakes or snacks to keep up?', 'info', 'appetite'),
  S('app-c-weight', 'concern', 'appetite', 'I\'m worried about my weight', 'mention', 'appetite'),
  S('app-b-weight', 'benefit', 'appetite', 'I\'ve lost weight and I\'m happy about it', 'mention', 'benefits', {
    note: 'Weight loss isn\'t one of the medication\'s intended effects, and the label lists it as a side effect to monitor. Tell your prescriber about it, especially if you\'re still growing or the loss continues.'
  }),

  /* Heart */
  S('heart-fast', 'effect', 'heart', 'My heart feels like it\'s racing or pounding', 'soon', 'heart'),
  S('heart-skip', 'effect', 'heart', 'Fluttering or skipped heartbeats', 'soon', 'heart'),
  S('heart-bp', 'effect', 'heart', 'My blood pressure readings are higher', 'soon', 'heart'),
  S('heart-chest', 'effect', 'heart', 'Chest pain or tightness', 'emergency', 'emergency', { watch: 'pain spreading to your arm, jaw or back, shortness of breath, sweating or fainting', action: CALL_911 }),
  S('heart-faint', 'effect', 'heart', 'I fainted or nearly fainted', 'emergency', 'emergency', { watch: 'chest pain, a racing or irregular heartbeat, or trouble breathing', action: CALL_911 }),
  S('heart-breath', 'effect', 'heart', 'New shortness of breath', 'emergency', 'emergency', { watch: 'chest pain, fainting, or lips or fingertips turning blue', action: CALL_911 }),
  S('heart-q-exercise', 'question', 'heart', 'Is it safe to exercise hard on it?', 'mention', 'heart'),
  S('heart-q-family', 'question', 'heart', 'Does my family\'s heart history matter?', 'mention', 'heart'),
  S('heart-c-longterm', 'concern', 'heart', 'I\'m worried about long-term heart effects', 'mention', 'heart'),

  /* Stomach */
  S('stom-pain', 'effect', 'stomach', 'Stomach aches', 'mention', 'stomach'),
  S('stom-nausea', 'effect', 'stomach', 'Nausea', 'mention', 'stomach'),
  S('stom-vomit', 'effect', 'stomach', 'Vomiting', 'soon', 'stomach'),
  S('stom-constip', 'effect', 'stomach', 'Constipation', 'info', 'stomach'),
  S('stom-diarrhea', 'effect', 'stomach', 'Diarrhea', 'info', 'stomach'),
  S('stom-severe', 'effect', 'stomach', 'Severe or constant belly pain, or blood in my stool', 'emergency', 'emergency', { watch: 'vomiting blood, black or bloody stools, or pain that keeps getting worse', action: 'get emergency care now' }),
  S('stom-q-food', 'question', 'stomach', 'Should I take it with food?', 'info', 'stomach'),

  /* Head */
  S('head-ache', 'effect', 'head', 'Headaches', 'mention', 'headache'),
  S('head-dizzy', 'effect', 'head', 'Dizziness or lightheadedness', 'mention', 'headache'),
  S('head-stroke', 'effect', 'head', 'Sudden weakness, numbness, trouble speaking or seeing', 'emergency', 'emergency', { watch: 'a drooping face, one arm drifting down, slurred speech, or a sudden severe headache', action: 'call 911 right away and note the time symptoms started' }),
  S('head-seizure', 'effect', 'head', 'I had a seizure', 'stop', 'emergency', { watch: 'a seizure lasting more than 5 minutes, another seizure soon after, or not waking up normally', action: 'call 911 if any of those happen' }),
  S('head-q-pain', 'question', 'head', 'What can I take for headaches with it?', 'info', 'headache'),

  /* Mood */
  S('mood-irrit', 'effect', 'mood', 'Irritable or short-tempered', 'mention', 'rebound'),
  S('mood-flat', 'effect', 'mood', 'I feel flat, numb or like a zombie', 'mention', 'mood'),
  S('mood-sad', 'effect', 'mood', 'Sad, hopeless or down most days', 'soon', 'mood'),
  S('mood-swings', 'effect', 'mood', 'Mood swings during the day', 'mention', 'rebound'),
  S('mood-crying', 'effect', 'mood', 'Crying more easily', 'mention', 'mood'),
  S('mood-anger', 'effect', 'mood', 'Angry outbursts or aggression', 'soon', 'mood'),
  S('mood-suicide', 'effect', 'mood', 'Thoughts of hurting myself or not wanting to live', 'emergency', 'emergency', {
    watch: 'a plan, a feeling you might act on these thoughts, or being unable to stay safe', action: 'call or text 988 (Suicide & Crisis Lifeline) now, or call 911 if you are in immediate danger'
  }),
  S('mood-mania', 'effect', 'mood', 'Racing thoughts, barely sleeping, feeling unstoppable', 'stop', 'psychosis', { watch: 'going days with little sleep, risky behavior, or believing things that aren\'t true', action: 'get emergency care if you or someone else could be hurt' }),
  S('mood-voices', 'effect', 'mood', 'Hearing or seeing things others don\'t', 'stop', 'psychosis', { watch: 'voices telling you to do things, confusion, or feeling unsafe', action: 'get emergency care if you or someone else could be hurt' }),
  S('mood-paranoia', 'effect', 'mood', 'Feeling watched, suspicious or paranoid', 'stop', 'psychosis', { watch: 'fear that others want to harm you, or acting on those fears', action: 'get emergency care if you or someone else could be hurt' }),
  S('mood-b-steadier', 'benefit', 'mood', 'My moods are steadier', 'info', 'benefits'),
  S('mood-b-euphoria', 'benefit', 'mood', 'I feel high or euphoric on it', 'soon', 'benefits', {
    note: 'Feeling high isn\'t an expected effect at prescribed doses. It can mean the dose is more than you need, and the FDA warns that chasing that feeling raises the risk of misuse. Tell your prescriber soon.'
  }),
  S('mood-q-depression', 'question', 'mood', 'Can it make depression or anxiety worse?', 'mention', 'mood'),
  S('mood-c-personality', 'concern', 'mood', 'People say my personality has changed', 'mention', 'mood'),

  /* Anxiety */
  S('anx-anxious', 'effect', 'anxiety', 'Anxiety or constant worry', 'mention', 'anxiety'),
  S('anx-jittery', 'effect', 'anxiety', 'Jittery or shaky', 'mention', 'anxiety'),
  S('anx-restless', 'effect', 'anxiety', 'Restless, can\'t sit still', 'mention', 'anxiety'),
  S('anx-panic', 'effect', 'anxiety', 'Panic attacks', 'soon', 'anxiety'),
  S('anx-tremor', 'effect', 'anxiety', 'Hand tremor', 'mention', 'anxiety'),
  S('anx-b-calmer', 'benefit', 'anxiety', 'I feel calmer and less scattered', 'info', 'benefits'),
  S('anx-q-caffeine', 'question', 'anxiety', 'Could caffeine be making the jitters worse?', 'info', 'substances'),

  /* Focus */
  S('foc-better', 'benefit', 'focus', 'Better focus at school or work', 'info', 'benefits'),
  S('foc-none', 'effect', 'focus', 'I don\'t notice any difference in focus', 'mention', 'timing'),
  S('foc-hyper', 'effect', 'focus', 'I hyperfocus on the wrong things', 'mention', 'area-focus'),
  S('foc-short', 'effect', 'focus', 'Focus fades too early in the day', 'mention', 'timing'),
  S('foc-q-dose', 'question', 'focus', 'Is my dose right for me?', 'mention', 'appointments'),
  S('foc-c-reliance', 'concern', 'focus', 'I\'m worried I can\'t focus without it', 'mention', 'area-focus'),

  /* Energy */
  S('en-crash', 'effect', 'energy', 'A crash when it wears off', 'mention', 'rebound'),
  S('en-tired', 'effect', 'energy', 'Drained or exhausted in the afternoon', 'mention', 'rebound'),
  S('en-b-energy', 'benefit', 'energy', 'More energy to get through the day', 'info', 'benefits'),
  S('en-q-booster', 'question', 'energy', 'Should I ask about an afternoon dose?', 'mention', 'timing'),

  /* Motivation */
  S('mot-better', 'benefit', 'motivation', 'Easier to start tasks', 'info', 'area-start'),
  S('mot-none', 'effect', 'motivation', 'I still can\'t get started on things', 'mention', 'area-start'),
  S('mot-q-strategies', 'question', 'motivation', 'What else helps with procrastination?', 'info', 'area-start'),

  /* Social */
  S('soc-quiet', 'effect', 'social', 'I\'m quieter or less social on it', 'mention', 'area-social'),
  S('soc-talk', 'effect', 'social', 'I talk too much or too fast', 'mention', 'area-social'),
  S('soc-b-listen', 'benefit', 'social', 'I listen better in conversations', 'info', 'area-social'),
  S('soc-q-school', 'question', 'social', 'Should my school or job know?', 'info', 'practical'),

  /* Thinking */
  S('think-forget', 'effect', 'thinking', 'I\'m still forgetting things', 'mention', 'area-memory'),
  S('think-rigid', 'effect', 'thinking', 'I get stuck on one thing and can\'t switch', 'mention', 'area-focus'),
  S('think-b-memory', 'benefit', 'thinking', 'I remember instructions better', 'info', 'area-memory'),
  S('think-time', 'effect', 'thinking', 'I still lose track of time', 'info', 'area-time'),

  /* Tics & movements */
  S('mov-tic', 'effect', 'movement', 'New tics or twitches', 'soon', 'tics'),
  S('mov-tic-worse', 'effect', 'movement', 'My existing tics got worse', 'soon', 'tics'),
  S('mov-pick', 'effect', 'movement', 'Skin picking, nail biting or hair pulling', 'mention', 'tics'),
  S('mov-grind', 'effect', 'movement', 'Teeth grinding or jaw clenching', 'mention', 'mouth'),
  S('mov-q-tourette', 'question', 'movement', 'I have tics or Tourette\'s. Is this OK for me?', 'mention', 'tics'),

  /* Circulation */
  S('circ-cold', 'effect', 'circulation', 'Cold or numb fingers or toes', 'mention', 'circulation'),
  S('circ-color', 'effect', 'circulation', 'Fingers or toes turn pale, blue or red', 'soon', 'circulation'),
  S('circ-wound', 'effect', 'circulation', 'Sores on my fingers or toes I can\'t explain', 'stop', 'circulation', { watch: 'skin that stays white or blue, spreading sores, or severe pain', action: 'get urgent care if a finger or toe stays cold and discolored' }),

  /* Body */
  S('body-sweat', 'effect', 'body', 'Sweating more than usual', 'info', 'skin'),
  S('body-hair', 'effect', 'body', 'Hair thinning', 'mention', 'skin'),
  S('body-rash', 'effect', 'body', 'A rash or hives', 'soon', 'skin'),
  S('body-allergy', 'effect', 'body', 'Swelling of my face, lips or throat, or trouble breathing', 'emergency', 'emergency', { watch: 'trouble swallowing, wheezing or feeling faint', action: CALL_911 }),
  S('body-blister', 'effect', 'body', 'A rash with blisters or peeling skin', 'emergency', 'emergency', { watch: 'fever, sores in the mouth or eyes, or skin that hurts', action: 'stop the medication and get emergency care now' }),
  S('body-vision', 'effect', 'body', 'Blurry vision or wide pupils', 'mention', 'skin'),
  S('body-heat', 'effect', 'body', 'Overheated, very high fever, stiff muscles or confusion', 'emergency', 'emergency', { watch: 'shivering, sweating, a racing heart, twitching muscles or agitation', action: 'stop the medication and ' + CALL_911 }),

  /* Mouth */
  S('mouth-dry', 'effect', 'mouth', 'Dry mouth', 'info', 'mouth'),
  S('mouth-taste', 'effect', 'mouth', 'A bad taste in my mouth', 'info', 'mouth'),
  S('mouth-teeth', 'question', 'mouth', 'Is it bad for my teeth?', 'info', 'mouth'),

  /* Sexual & urinary */
  S('sex-libido', 'effect', 'sexual', 'Changes in sex drive', 'mention', 'sexual'),
  S('sex-ed', 'effect', 'sexual', 'Trouble getting or keeping an erection', 'mention', 'sexual'),
  S('sex-priapism', 'effect', 'sexual', 'An erection that won\'t go away (over 4 hours)', 'emergency', 'emergency', { watch: 'pain, or an erection that lasts longer than 4 hours', action: 'get emergency care right away to prevent lasting damage' }),
  S('sex-urine', 'effect', 'sexual', 'Trouble urinating or urinary infections', 'mention', 'sexual'),
  S('sex-period', 'question', 'sexual', 'Does it affect periods or birth control?', 'info', 'sexual'),

  /* Growth */
  S('grow-height', 'concern', 'growth', 'I\'m worried about growth or height', 'mention', 'growth'),
  S('grow-weight', 'effect', 'growth', 'My child isn\'t gaining weight', 'soon', 'growth'),
  S('grow-checks', 'effect', 'growth', 'Height or weight checks have changed', 'soon', 'growth'),
  S('grow-q-breaks', 'question', 'growth', 'Should we take breaks on weekends or in summer?', 'mention', 'growth'),

  /* Timing */
  S('time-early', 'effect', 'timing', 'It wears off too early', 'mention', 'timing'),
  S('time-late', 'effect', 'timing', 'It lasts too far into the evening', 'mention', 'timing'),
  S('time-slow', 'effect', 'timing', 'It takes too long to kick in', 'info', 'timing'),
  S('time-weak', 'effect', 'timing', 'It doesn\'t seem to work as well as before', 'mention', 'timing'),
  S('time-generic', 'effect', 'timing', 'It feels different since my pharmacy switched manufacturers', 'mention', 'practical'),
  S('time-q-sprinkle', 'question', 'timing', 'Can I open the capsule and sprinkle it on food?', 'info', 'timing'),

  /* Interactions */
  S('int-coffee', 'question', 'interactions', 'How much caffeine is OK?', 'info', 'substances'),
  S('int-alcohol', 'question', 'interactions', 'Can I drink alcohol on it?', 'mention', 'substances'),
  S('int-cannabis', 'question', 'interactions', 'Does cannabis or nicotine interact with it?', 'mention', 'substances'),
  S('int-ssri', 'question', 'interactions', 'I also take an antidepressant or migraine medicine. Is that OK?', 'soon', 'interactions'),
  S('int-maoi', ['concern', 'question'], 'interactions', 'I took an MAOI antidepressant in the last 14 days', 'stop', 'interactions', {
    watch: 'a severe headache, a very fast heartbeat, high fever or confusion', action: CALL_911 + ' if any of those start'
  }),
  S('int-antacid', 'question', 'interactions', 'Do antacids or acidic drinks change how it works?', 'info', 'interactions'),
  S('int-cold', 'question', 'interactions', 'Are cold medicines or supplements OK with it?', 'mention', 'interactions'),

  /* Safety */
  S('saf-extra', 'concern', 'safety', 'I\'ve taken more than prescribed', 'soon', 'safety'),
  S('saf-overdose', 'effect', 'safety', 'I took too much and feel very unwell', 'emergency', 'emergency', {
    watch: 'a racing heart, chest pain, confusion, hallucinations, high fever or a seizure', action: 'call 911, or Poison Control at 1-800-222-1222 if you have no symptoms yet'
  }),
  S('saf-share', 'question', 'safety', 'Someone asked me for some of my medication', 'info', 'safety'),
  S('saf-crave', 'concern', 'safety', 'I want to take more to feel it', 'soon', 'safety'),
  S('saf-store', 'question', 'safety', 'How should I store and get rid of it?', 'info', 'safety'),
  S('saf-missed', 'question', 'safety', 'What should I do if I miss a dose?', 'info', 'missed'),
  S('saf-double', 'concern', 'safety', 'I accidentally took a double dose', 'soon', 'missed'),

  /* Practical */
  S('prac-refill', 'question', 'practical', 'Why can\'t I refill it early?', 'info', 'practical'),
  S('prac-shortage', 'question', 'practical', 'What if my pharmacy is out of stock?', 'info', 'practical'),
  S('prac-cost', 'question', 'practical', 'Is there a cheaper option?', 'info', 'practical'),
  S('prac-travel', 'question', 'practical', 'Can I travel with it?', 'info', 'practical'),
  S('prac-accom', 'question', 'practical', 'Can I get accommodations at school or work?', 'info', 'practical'),
  S('prac-drive', 'question', 'practical', 'Is it safe to drive on it?', 'info', 'practical'),
  S('prac-test', 'question', 'practical', 'Will it show up on a drug test?', 'info', 'practical'),

  /* General / appointments */
  S('gen-phase', 'question', 'other', 'How long until we know this dose is right?', 'info', 'appointments'),
  S('gen-switch', 'question', 'other', 'Should I ask about a different medication?', 'mention', 'appointments'),
  S('gen-stop', 'question', 'other', 'Can I stop taking it suddenly?', 'mention', 'appointments'),
  S('gen-pregnant', 'concern', 'other', 'I\'m pregnant, breastfeeding or planning a pregnancy', 'soon', 'appointments'),

  /* Benefits */
  S('ben-school', 'benefit', 'focus', 'Grades or work performance improved', 'info', 'benefits'),
  S('ben-relation', 'benefit', 'social', 'Getting along better with family or friends', 'info', 'benefits'),
  S('ben-driving', 'benefit', 'focus', 'More attentive when driving', 'info', 'benefits'),
  S('ben-organized', 'benefit', 'thinking', 'More organized day to day', 'info', 'benefits')
];

export const suggestionById = (id: string | null) => (id ? SUGGESTIONS.find(s => s.id === id) : undefined);

export function suggestionsFor(type: LogType, cat: string): Suggestion[] {
  const exact = SUGGESTIONS.filter(s => s.cat === cat && s.types.includes(type));
  // Questions and concerns overlap: show the other kind too when the list is thin.
  if (exact.length >= 3 || (type !== 'question' && type !== 'concern')) return exact;
  const other = type === 'question' ? 'concern' : 'question';
  return [...exact, ...SUGGESTIONS.filter(s => s.cat === cat && s.types.includes(other) && !exact.includes(s))];
}

const TYPE_NOUN: Record<LogType, string> = { effect: 'side effect', benefit: 'benefit', question: 'question', concern: 'concern' };
export const typeLabel: Record<LogType, string> = { effect: 'Side effect', benefit: 'Benefit', question: 'Question', concern: 'Concern' };

export interface Guidance { tone: 'info' | 'soon' | 'stop' | 'emergency'; title: string; body: string }

/** The message shown under a selected suggestion. */
export function guidanceFor(s: Suggestion, type: LogType, covers: string[]): Guidance {
  const list = covers.length > 1 ? `${covers.slice(0, -1).join(', ')} and ${covers[covers.length - 1]}` : covers[0] ?? 'background and next steps';
  const attach = `Add it, then open the attached article in your logging library.`;
  if (s.urgency === 'emergency') return {
    tone: 'emergency', title: 'This can be an emergency',
    body: `Don't wait for an appointment: ${s.action ?? CALL_911}. Watch for ${s.watch ?? 'worsening symptoms'}. Once you're safe, the attached article in your logging library explains what to tell your prescriber.`
  };
  if (s.urgency === 'stop') return {
    tone: 'stop', title: 'Stop and call your prescriber',
    body: `Based on this ${TYPE_NOUN[type]}, Bloodstream recommends you stop taking this medication until you've spoken with your prescriber, and reach them today. The FDA label asks prescribers to reassess treatment when this happens. Watch for ${s.watch ?? 'worsening symptoms'}, and ${s.action ?? CALL_911}. The attached article in your logging library explains what to tell them.`
  };
  if (s.note) return { tone: s.urgency === 'soon' ? 'soon' : 'info', title: s.urgency === 'soon' ? 'Worth a call soon' : 'Worth reporting', body: `${s.note} The attached article covers ${list}. ${attach}` };
  if (s.urgency === 'soon') return {
    tone: 'soon', title: 'Contact your prescriber soon',
    body: `This is worth raising before your next routine visit, by phone or patient portal. Bloodstream has an article that covers ${list}. ${attach}`
  };
  return {
    tone: 'info', title: 'Bloodstream has guidance for this',
    body: `There's an article that may help with this entry, covering ${list}. ${attach}`
  };
}

export const CUSTOM_GUIDANCE: Guidance = {
  tone: 'info', title: 'No matching suggestion',
  body: 'Sorry, there isn\'t a suggestion that matches this yet. The articles in your logging library may still have relevant advice, and your prescriber will want to hear it either way.'
};
