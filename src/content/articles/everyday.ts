import type { Article } from '../types';
import { SRC } from '../sources';

export const EVERYDAY: Article[] = [
  {
    id: 'timing', section: 'Everyday', read: 7,
    title: 'How long it lasts: onset, peak and wear-off',
    dek: 'IR and XR follow different curves, and plenty of everyday things nudge them around. How to read yours, and what to tell your prescriber when it feels off.',
    covers: ['the typical curve for IR and XR', 'why it can feel different day to day', 'what to note for your prescriber'],
    blocks: [
      { k: 'p', t: 'Both forms of Adderall contain the same mix of amphetamine salts. The difference is how fast it gets into your bloodstream.' },
      { k: 'h', t: 'Immediate release (IR) tablets' },
      { k: 'v', v: { type: 'curve', kind: 'IR', show: 'both', hours: 14, marks: [{ h: 0, label: 'Dose' }, { h: 3, label: 'Peak ~3 h' }] }, cap: 'Blood level (solid) peaks about 3 hours after an IR dose. Felt effect (dashed) usually lasts about 4 to 6 hours, which is why IR is often taken two or three times a day.' },
      { k: 'h', t: 'Extended release (XR) capsules' },
      { k: 'v', v: { type: 'curve', kind: 'XR', show: 'both', hours: 20, marks: [{ h: 0, label: 'Dose' }, { h: 7, label: 'Peak ~7 h' }] }, cap: 'XR capsules hold two kinds of beads: half release right away and half a few hours later. The label notes that XR 20 mg once a day gives levels similar to IR 10 mg taken twice, four hours apart. Felt effect usually lasts about 8 to 12 hours.' },
      { k: 'h', t: 'Why the same dose can feel different' },
      { k: 'ul', items: [
        '**Food.** A high-fat breakfast doesn\'t change how much XR you absorb, but it pushes the peak back by about two and a half hours.',
        '**Acidity.** Vitamin C and juice can lower levels; antacids can raise and prolong them. The interactions article has the details, and What shapes your curve explains how Bloodstream accounts for diet and medicines.',
        '**Sleep and stress.** A short night or a very stressful day can make a good dose feel weak.',
        '**Illness and hydration.**',
        '**Hormones.** Some people notice a difference across their menstrual cycle.',
        '**A different manufacturer.** Generics must meet FDA standards, but some people notice a change when the pharmacy switches brands.'
      ] },
      { k: 'h', t: 'Opening XR capsules' },
      { k: 'p', t: 'If swallowing capsules is hard, the label allows opening an XR capsule and sprinkling **all** of the beads on a spoonful of applesauce. Swallow it right away without chewing the beads, and don\'t save part of it for later or split the beads between doses. IR tablets should only be split if your pharmacist says that particular tablet can be.' },
      { k: 'h', t: 'When it doesn\'t seem to work' },
      { k: 'p', t: 'Before concluding the medication has stopped working, check the usual suspects above for a week. Then tell your prescriber what you noticed. Don\'t take extra to make up for a weak day: more medicine on top of a bad night\'s sleep usually means more side effects, not more focus.' },
      { k: 'v', v: { type: 'check', title: 'Useful notes for your prescriber', items: [
        'What time you took it and when you first noticed it working',
        'When it started fading, and whether that\'s earlier or later than before',
        'Breakfast that day, and how you slept the night before',
        'Any new medicines, supplements or a change of pharmacy brand'
      ] } }
    ],
    sources: [SRC.FDA_XR, SRC.FDA_IR, SRC.HC_MONO],
    related: ['curve-factors', 'rebound', 'interactions', 'missed']
  },

  {
    id: 'benefits', section: 'With your prescriber', read: 5,
    title: 'Benefits worth reporting',
    dek: 'Your prescriber needs to hear what\'s working, not only what isn\'t. And a few "benefits" are actually warning signs.',
    covers: ['why benefits matter to your prescriber', 'benefits that are really warning signs', 'how to describe progress'],
    blocks: [
      { k: 'p', t: 'Finding the right dose is a balance. The goal is the most benefit with side effects you can live with. If you only ever report problems, your prescriber sees half the picture, and might lower a dose that\'s actually doing a lot for you.' },
      { k: 'h', t: 'Good benefits to log' },
      { k: 'ul', items: [
        'Finishing things you used to abandon halfway',
        'Better grades, work reviews or fewer missed deadlines',
        'Fewer arguments at home, or better friendships',
        'Driving more attentively',
        'Less time lost looking for things, being late or forgetting appointments',
        'Feeling calmer and less scattered, while still feeling like yourself'
      ] },
      { k: 'v', v: { type: 'compare',
        a: { title: 'Healthy signs', items: ['Calmer, more organized', 'Steadier mood', 'Better follow-through', 'Still hungry at dinner, sleeping okay'] },
        b: { title: 'Report these', items: ['Staying up all night working', 'Feeling high or euphoric', 'Weight loss you\'re happy about', 'Barely needing sleep, feeling unstoppable'] }
      }, cap: 'The right column can feel good, but each one is a side effect or a warning sign, not a goal.' },
      { k: 'h', t: 'Why those aren\'t wins' },
      { k: 'p', t: 'Staying up all night means the medicine is still active at bedtime, and lost sleep wipes out much of the next day\'s benefit. Feeling high suggests more medicine than you need, and the FDA links chasing that feeling to misuse. Unintended weight loss is something the label asks prescribers to monitor. And needing little sleep while feeling unstoppable can be an early sign of mania.' },
      { k: 'h', t: 'How to describe progress' },
      { k: 'ol', items: [
        'Use specific examples: "I finished my report two days early" beats "I\'m doing better."',
        'Compare with before: what used to happen in the same situation?',
        'Bring other perspectives: teacher notes, a partner\'s observations, report cards.',
        'Mention the time of day: benefits that fade by mid-afternoon are useful information too.'
      ] }
    ],
    sources: [SRC.FDA_XR, SRC.FDA_2023, SRC.AAP, SRC.CDC_TX],
    related: ['appointments', 'sleep', 'psychosis']
  },

  {
    id: 'appointments', section: 'With your prescriber', read: 8,
    title: 'Getting the most from appointments',
    dek: 'How dose adjustments usually work, what to bring, the questions worth asking, and how your logging library fits in.',
    covers: ['how dose adjustments usually work', 'what to bring', 'questions worth asking', 'how long changes take to judge'],
    blocks: [
      { k: 'p', t: 'Appointments about ADHD medication are often short. Coming in with clear notes is the best way to make that time count, and it\'s the whole reason Bloodstream has a logging library.' },
      { k: 'h', t: 'How adjustments usually work' },
      { k: 'p', t: 'Prescribers usually start with a low dose and adjust in small steps, often about a week apart, watching for benefits and side effects at each step. The label describes this kind of gradual adjustment. Stimulants work the same day they\'re taken, so each step can be judged fairly quickly compared with medicines like antidepressants.' },
      { k: 'v', v: { type: 'cycle', title: 'The adjustment loop', steps: ['Take it as prescribed', 'Notice effects and side effects', 'Log them in Bloodstream', 'Discuss at your appointment', 'Your prescriber adjusts or confirms'] }, cap: 'Bloodstream helps with the middle steps. Decisions about the dose stay between you and your prescriber.' },
      { k: 'callout', tone: 'info', t: 'Bloodstream never suggests doses or changes. It records what you take and what you notice, so the conversation with your prescriber starts from facts.' },
      { k: 'h', t: 'What to bring' },
      { k: 'v', v: { type: 'check', title: 'Before the visit', items: [
        'Your logging library, shared as a list from the Entries tab',
        'Your usual dose times, and how consistent they\'ve been (the calendar shows this)',
        'Home blood pressure readings, if you take them',
        'Notes on sleep, appetite and mood',
        'School reports, teacher notes or rating scales, for children',
        'A list of every medicine and supplement you take'
      ] } },
      { k: 'h', t: 'Questions worth asking' },
      { k: 'ul', items: [
        'What should I expect from this dose, and how will we know it\'s right?',
        'Which side effects should I call you about, rather than waiting?',
        'Would a different time of day or release type suit my schedule better?',
        'What\'s my cut-off time for a late dose?',
        'Should I check my blood pressure or weight at home?',
        'If this doesn\'t work well, what are the other options?'
      ] },
      { k: 'h', t: 'Other options exist' },
      { k: 'p', t: 'If Adderall isn\'t a good fit, there are other stimulants, such as methylphenidate-based medicines, and non-stimulants such as atomoxetine, viloxazine, guanfacine and clonidine. Behavioral treatments, parent training for younger children, and skills-based therapy for adults also have good evidence, alone or alongside medication.' },
      { k: 'h', t: 'Stopping' },
      { k: 'p', t: 'Talk to your prescriber before stopping. Amphetamine doesn\'t usually cause dangerous withdrawal at prescribed doses, but the label notes that stopping suddenly after long-term high doses can cause extreme tiredness and low mood. Your ADHD symptoms will also come back, so it\'s good to plan for that.' },
      { k: 'h', t: 'After the visit' },
      { k: 'ul', items: [
        'Clear the entries you covered from your library so the next list starts fresh.',
        'If your dose or timing changed, update your saved medications and schedules in Bloodstream.',
        'Add your next appointment so Bloodstream can remind you to start noting things a few weeks ahead.'
      ] }
    ],
    sources: [SRC.FDA_XR, SRC.CDC_TX, SRC.NHS_TX, SRC.AAP],
    related: ['benefits', 'timing', 'practical']
  },

  {
    id: 'practical', section: 'Everyday', read: 8,
    title: 'Refills, pharmacies and everyday logistics',
    dek: 'Why refills work the way they do, what to do in a shortage, and how to handle travel, school, work, driving and drug tests.',
    covers: ['refill rules for Schedule II medicines', 'what to do during a shortage', 'travel, school, work, driving and drug tests'],
    blocks: [
      { k: 'h', t: 'Why refills are strict' },
      { k: 'p', t: 'Adderall is a Schedule II controlled substance in the US. Federal rules don\'t allow refills on Schedule II prescriptions: every fill needs a new prescription. Prescribers can, however, write several prescriptions at once covering up to a 90-day supply, each marked with the earliest date it can be filled. Pharmacies and insurers are also strict about filling early.' },
      { k: 'v', v: { type: 'check', title: 'Making refills smoother', items: [
        'Request a new prescription about a week before you run out',
        'Ask whether multiple dated prescriptions are an option for you',
        'Use one pharmacy, so your history is in one place',
        'Call ahead to check they have your strength in stock'
      ] } },
      { k: 'h', t: 'During a shortage' },
      { k: 'p', t: 'Stimulant shortages have come and gone in recent years. The FDA\'s Drug Shortages database shows current status. If your pharmacy is out, ask them to check other locations, or ask your prescriber whether a different strength or form would work in the meantime. Never buy from websites or people selling without a prescription: the FDA warns that counterfeit stimulants may contain fentanyl or methamphetamine.' },
      { k: 'h', t: 'Generic switches' },
      { k: 'p', t: 'Generic versions must meet FDA standards for being equivalent to the brand. Even so, some people notice a difference when the pharmacy changes manufacturers, especially with XR capsules. If you do, log it with the manufacturer name from the bottle, tell your prescriber, and consider reporting it to FDA MedWatch.' },
      { k: 'h', t: 'Travel' },
      { k: 'ul', items: [
        'Keep it in your carry-on, in the original labeled bottle.',
        'Pack enough for the trip plus a few extra days, since early refills are hard to get away from home.',
        'Across time zones, keep taking it in your local morning. Ask your prescriber about the travel days.',
        'Some countries ban or strictly limit amphetamine. Check with the destination\'s embassy before you go.'
      ] },
      { k: 'h', t: 'School and work' },
      { k: 'p', t: 'Students with ADHD may qualify for support under Section 504 or an IEP, such as extra time, breaks or a quieter testing room. At work, the Job Accommodation Network (JAN) has free guidance on reasonable accommodations. You don\'t have to share which medicine you take to ask for support.' },
      { k: 'h', t: 'Driving' },
      { k: 'p', t: 'ADHD itself affects driving, and many people find they drive more attentively while their medicine is working. The label still advises care with driving and machinery until you know how the medicine affects you. Be extra careful in the comedown window and on short sleep.' },
      { k: 'h', t: 'Drug tests' },
      { k: 'p', t: 'Standard drug screens look for amphetamines, so a prescribed dose can show up. Tell the testing service you have a prescription. A reviewing doctor (often called a medical review officer) can verify it with your pharmacy, and you don\'t need to share your diagnosis with an employer.' }
    ],
    sources: [SRC.CFR_RX, SRC.FDA_SHORTAGE, SRC.FDA_2023, SRC.MEDWATCH, SRC.TSA, SRC.ED_504, SRC.JAN, SRC.FDA_XR],
    related: ['safety', 'appointments', 'timing']
  },
  {
    id: 'curve-factors', section: 'Everyday', read: 6,
    title: 'What shapes your curve',
    dek: 'Body weight, urine acidity, kidneys, meals and some medicines change how fast amphetamine is absorbed and cleared. What the research shows, and what Bloodstream does with it.',
    covers: ['how weight, diet and kidney function change clearance', 'how meals and acid reducers change XR timing', 'what Bloodstream doesn\'t model and why'],
    blocks: [
      { k: 'p', t: 'Bloodstream\'s default curve uses averages from the FDA label: the half-lives for your age group and the absorption seen in healthy volunteers. Real people differ. **Body & medicines**, in Data & information controls, lets you describe the factors that have published numbers, and your curve, its shaded range and the ng/mL estimate update to match.' },
      { k: 'h', t: 'Clearance: how long a dose lingers' },
      { k: 'p', t: 'At normal urine acidity, roughly a third of each dose leaves through the kidneys unchanged, and that share swings widely with urine pH. Amphetamine is a weak base: acidic urine traps it so it is flushed out, while less acidic urine lets the kidneys reabsorb it. The labels report anywhere from 1% to 75% of a dose leaving unchanged depending on urine pH, and clinical studies found the half-life changed by about 7 hours for each unit of urine pH.' },
      { k: 'v', v: { type: 'bars', title: 'd-amphetamine half-life in an adult', unit: 'h', rows: [
        { label: 'Label average', a: 10 },
        { label: 'Mostly plant-based diet', a: 13.5 },
        { label: 'Severe kidney impairment', a: 17.5 },
        { label: 'Kidney failure', a: 23.3 }
      ] }, cap: 'Diet: a 24-hour urine study found pH 6.7 in vegans and 6.2 in omnivores, about half a unit. Kidneys: d-amphetamine clearance fell from 0.7 to 0.4 L/h/kg in severe impairment and to 0.3 in kidney failure. When several apply, Bloodstream multiplies them, up to three times the label value.' },
      { k: 'ul', items: [
        '**Body weight.** The XR label found weight was the main reason levels differ between people: half-life rose with weight, and women\'s 20 to 30% higher levels shrank once doses were compared per kilogram. Bloodstream scales concentrations by weight and nudges the half-life with the standard size rule (half-life grows with the quarter power of weight).',
        '**Age.** Children 6 to 12 have half-lives about 1 hour (d) and 2 hours (l) shorter than adults. Older adults weren\'t studied, so 65+ uses adult values with a wider range.',
        '**Medicines that change urine acidity.** The label says alkalinizing agents (acetazolamide, some thiazides, sodium bicarbonate) raise levels and should be avoided with Adderall XR, and acidifying agents lower them. It gives no sizes, so Bloodstream assumes about one pH unit up or half a unit down and shows a wide range.'
      ] },
      { k: 'h', t: 'Absorption: when XR peaks' },
      { k: 'v', v: { type: 'stats', items: [
        { value: '+2.5 h', label: 'XR peak after a high-fat meal, same total amount' },
        { value: '1.25–2.5 h', label: 'earlier XR peak on omeprazole (median, d and l)' }
      ] } },
      { k: 'p', t: 'A high-fat meal delays the XR peak by about 2.5 hours without changing how much is absorbed, so Bloodstream shifts that dose\'s whole curve, including when the felt effect fades. Mark it when you log, or later with Edit. A daily proton pump inhibitor such as omeprazole made XR peak sooner in the label\'s study, with the same total amount. Neither has been studied with IR tablets, so IR curves don\'t change.' },
      { k: 'h', t: 'What only widens the range' },
      { k: 'p', t: 'Some things plausibly matter but have no numbers to model. For these Bloodstream keeps the curve and widens the shaded range, mostly on the slow side: strong CYP2D6 inhibitors (the label says they may increase exposure, but CYP2D6 is a minor pathway for amphetamine), liver disease and mild or moderate kidney impairment (not studied), being 65 or older, and pregnancy.' },
      { k: 'h', t: 'Not modeled' },
      { k: 'v', v: { type: 'compare',
        a: { title: 'No measured effect on levels', items: ['Caffeine, nicotine, alcohol, cannabis', 'Sleep, stress, illness, hydration, exercise', 'Occasional vitamin C, juice or antacids (no numbers for everyday amounts)', 'Switching generic makers (bioequivalence limits keep averages close)'] },
        b: { title: 'Safety notes, not curve changes', items: ['MAOIs: never combined, or within 14 days', 'Serotonergic medicines: know the signs of serotonin syndrome', 'Menstrual cycle phase: small, mixed lab studies on how it feels'] }
      } },
      { k: 'p', t: 'The shaded range on your curve shows ordinary person-to-person variation, mostly from day-to-day urine acidity: on a mixed diet, urine pH usually sits between about 5.9 and 6.4. The ng/mL figure is calibrated to the XR label, where 20 mg in healthy adults peaked around 37 ng/mL of total amphetamine (d and l together), with roughly 25% variation between people. There is no established target level for ADHD treatment; people respond differently to the same amount.' },
      { k: 'callout', tone: 'warn', title: 'Describe, don\'t adjust', t: 'Body & medicines describes your situation so the estimate fits better. Don\'t start or stop medicines, change your diet, or take supplements or antacids to change how strong or how long Adderall feels. If timing or strength isn\'t working, talk to your prescriber. Bloodstream never suggests doses.' }
    ],
    sources: [SRC.XR_PK, SRC.XR_PPI, SRC.FDA_XR, SRC.FDA_IR, SRC.VYVANSE, SRC.ANGGARD, SRC.GUNNE, SRC.PENCZYNSKI, SRC.ALLOMETRY, SRC.HC_MONO, SRC.WHITE_2002, SRC.JUSTICE_2000],
    related: ['timing', 'interactions']
  }
];
