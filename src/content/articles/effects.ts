import type { Article } from '../types';
import { SRC } from '../sources';

export const EFFECTS: Article[] = [
  {
    id: 'sleep', section: 'Side effects', read: 7,
    title: 'Sleep and stimulants',
    dek: 'Trouble falling asleep is one of the most common side effects, and one of the most fixable. Why it happens, what helps, and what to ask about.',
    covers: ['why it happens', 'habits that help', 'questions to ask about timing', 'when sleep problems need a call'],
    blocks: [
      { k: 'p', t: 'In the Adderall XR trials, trouble sleeping was one of the top side effects in every age group. The good news is that it\'s often about timing, and timing is adjustable.' },
      { k: 'v', v: { type: 'bars', title: 'Insomnia in Adderall XR trials', legend: ['Adderall XR', 'Placebo'], unit: '%', rows: [
        { label: 'Children 6 to 12', a: 17, b: 2 }, { label: 'Teens 13 to 17', a: 12, b: 4 }, { label: 'Adults', a: 27, b: 13 }
      ] }, cap: 'From the FDA label. The placebo column shows that some sleep trouble happens anyway, which fits with how common sleep problems are in ADHD itself.' },
      { k: 'h', t: 'Why it happens' },
      { k: 'ul', items: [
        '**Still active at bedtime.** If a meaningful amount of the dose is still working, your brain is still being nudged toward alertness. Bloodstream\'s sleep card estimates this for your planned bedtime.',
        '**Rebound.** As the dose wears off, some people get a burst of restlessness or racing thoughts in the evening.',
        '**ADHD itself.** Many people with ADHD naturally fall asleep later. The medication can add to a pattern that was already there.',
        '**Stacking.** Afternoon caffeine, a late booster dose or evening screens all pile on.'
      ] },
      { k: 'v', v: { type: 'curve', kind: 'XR', show: 'both', hours: 20, marks: [{ h: 0, label: '8 AM dose' }, { h: 14.5, label: '10:30 PM' }], threshold: { y: 0.25, label: 'Low enough for most people to sleep' } }, cap: 'A typical XR curve. Felt effect (dashed) fades hours before the medicine is fully cleared (solid). Your own curve is on the dashboard.' },
      { k: 'h', t: 'Habits that help' },
      { k: 'ul', items: [
        'Get up at the same time every day, weekends included. A steady wake time does more for bedtime than forcing yourself to bed early.',
        'Get daylight soon after waking, and dim lights and screens for the last hour before bed.',
        'Stop caffeine by early afternoon.',
        'Exercise earlier in the day rather than late in the evening.',
        'Build a short, boring wind-down routine and do it in the same order every night.',
        'If you can\'t sleep after about 20 minutes, get up and do something calm in low light, then try again.'
      ] },
      { k: 'h', t: 'Questions to ask your prescriber' },
      { k: 'v', v: { type: 'check', title: 'Bring these to your visit', items: [
        'Would taking my dose earlier help?',
        'Is my release type (IR or XR) the best fit for my schedule?',
        'Is a sleep aid or melatonin appropriate for me?',
        'Could anything else I take be keeping me up?'
      ] } },
      { k: 'p', t: 'Changing when or how much you take is a decision for your prescriber. What you can do is bring good information: your usual dose time, when you fell asleep, and how rested you felt. Logging a few nights in a row is far more useful than describing "bad sleep" from memory.' },
      { k: 'h', t: 'Why it matters' },
      { k: 'p', t: 'Lost sleep makes attention, mood and impulse control worse, which is exactly what the medication is trying to help. A dose that wins you focus in the day but costs you two hours of sleep at night may not be a good trade, and your prescriber will want to know.' },
      { k: 'callout', tone: 'warn', title: 'Call soon if', t: 'You\'re sleeping much less than usual and feel wired rather than tired, you\'re very sleepy in the day despite a full night, or sleep problems last more than a couple of weeks.' }
    ],
    sources: [SRC.FDA_XR, SRC.KELTY, SRC.NHLBI_SLEEP, SRC.NHS_TX],
    related: ['area-sleep', 'timing', 'substances']
  },

  {
    id: 'appetite', section: 'Side effects', read: 6,
    title: 'Appetite and weight',
    dek: 'Most people eat less while their dose is active. A few simple patterns keep meals and energy on track, and a few signs mean it\'s time to call.',
    covers: ['eating around the dose', 'easy ways to keep calories up', 'when weight loss needs a call'],
    blocks: [
      { k: 'p', t: 'Reduced appetite is the most common side effect of Adderall XR in children and teens and one of the most common in adults. It usually follows the dose: strongest around the peak, easing as levels fall, and often turning into big hunger in the evening.' },
      { k: 'v', v: { type: 'bars', title: 'Loss of appetite in Adderall XR trials', legend: ['Adderall XR', 'Placebo'], unit: '%', rows: [
        { label: 'Children 6 to 12', a: 22, b: 2 }, { label: 'Teens 13 to 17', a: 36, b: 2 }, { label: 'Adults', a: 33, b: 3 }
      ] }, cap: 'From the FDA label. Weight loss was also reported in about 9% of teens and 10% of adults in those trials.' },
      { k: 'h', t: 'Eat with the curve, not against it' },
      { k: 'v', v: { type: 'day', title: 'A day that works with the dose', from: 6, to: 23, items: [
        { h: 7.3, label: 'Breakfast', tone: 'meal' }, { h: 8, label: 'Dose', tone: 'dose' }, { h: 12.3, label: 'Small lunch', tone: 'meal' },
        { h: 15.5, label: 'Snack', tone: 'meal' }, { h: 18.5, label: 'Dinner', tone: 'meal' }, { h: 20.5, label: 'Second supper', tone: 'meal' }
      ], band: { from: 9, to: 16, label: 'Appetite lowest' } }, cap: 'Front-load the day and add an evening meal when hunger comes back.' },
      { k: 'ul', items: [
        '**Breakfast before the dose.** A solid breakfast before the medication kicks in is the single most recommended tip.',
        '**Graze in the middle of the day.** Small, easy foods are easier than a full plate when you\'re not hungry.',
        '**Make calories count.** Nut butters, cheese, yogurt, eggs, whole milk, avocado, granola.',
        '**Drink some of it.** Smoothies or meal-replacement shakes work when chewing feels like a chore.',
        '**Plan a second supper.** An evening snack or small meal before bed makes up for a light lunch.',
        '**Set a reminder.** Hunger cues are quiet on the medication, so a phone alarm can do the job.'
      ] },
      { k: 'h', t: 'For parents' },
      { k: 'p', t: 'Pack foods your child actually likes, let them help choose snacks, and don\'t turn lunch into a battle. Growth is checked at regular visits, so bring any worries there. The growth article in your library goes into more detail.' },
      { k: 'h', t: 'When to call' },
      { k: 'callout', tone: 'warn', t: 'Call your prescriber if you or your child keeps losing weight without trying, is regularly skipping meals, feels dizzy or weak, or a child\'s height or weight checks are falling behind. Also tell them if you have a history of an eating disorder.' },
      { k: 'h', t: 'Weight loss as a "benefit"' },
      { k: 'p', t: 'Some people are pleased to lose weight on Adderall. It isn\'t an intended effect, it\'s a side effect the label asks prescribers to monitor, and it can mask under-eating. It\'s worth reporting either way.' }
    ],
    sources: [SRC.FDA_XR, SRC.CHC_APPETITE, SRC.KELTY],
    related: ['area-appetite', 'growth', 'stomach']
  },

  {
    id: 'stomach', section: 'Side effects', read: 5,
    title: 'Stomach aches, nausea and digestion',
    dek: 'Stomach symptoms are common early on and often settle. Food, water and timing help, and a few signs mean you shouldn\'t wait.',
    covers: ['why it happens', 'food and timing tips', 'signs that need care'],
    blocks: [
      { k: 'p', t: 'Stimulants act on nerves throughout the body, including the gut. Stomach aches are especially common in children, and nausea is more common in adults. For many people they fade over the first few weeks.' },
      { k: 'v', v: { type: 'bars', title: 'Stomach side effects in Adderall XR trials', legend: ['Adderall XR', 'Placebo'], unit: '%', rows: [
        { label: 'Belly pain, children', a: 14, b: 10 }, { label: 'Belly pain, teens', a: 11, b: 2 },
        { label: 'Vomiting, children', a: 7, b: 4 }, { label: 'Nausea, adults', a: 8, b: 3 }, { label: 'Diarrhea, adults', a: 6, b: 0 }
      ] }, cap: 'From the FDA label.' },
      { k: 'h', t: 'What helps' },
      { k: 'ul', items: [
        '**Take it with food.** XR can be taken with or without food. Food doesn\'t change how much you absorb, but a high-fat meal delays the peak by about two and a half hours, which some people notice.',
        '**Drink water** through the morning. Dry mouth and less thirst are common on stimulants.',
        '**Go easy on caffeine** on an empty stomach.',
        '**Smaller meals** can sit better than a large one while the dose is active.',
        '**Constipation:** fiber, fluids and movement. Ask a pharmacist before using laxatives regularly.'
      ] },
      { k: 'h', t: 'Note the timing' },
      { k: 'p', t: 'Does it start soon after the dose, at the peak, or as it wears off? Is it worse on days you skipped breakfast? A week of quick notes in Bloodstream turns "my stomach hurts sometimes" into something your prescriber can act on.' },
      { k: 'callout', tone: 'urgent', title: 'Get care right away', t: 'Severe or constant belly pain, vomiting blood, black or bloody stools, or pain that keeps getting worse.' },
      { k: 'callout', tone: 'warn', title: 'Call soon', t: 'Vomiting that keeps happening, stomach pain that makes you or your child avoid eating, or symptoms that haven\'t settled after a few weeks.' }
    ],
    sources: [SRC.FDA_XR, SRC.HC_MONO, SRC.MEDLINE],
    related: ['appetite', 'timing', 'headache']
  },

  {
    id: 'headache', section: 'Side effects', read: 5,
    title: 'Headaches and dizziness',
    dek: 'Headaches are common in adults on Adderall. Usually the cause is simple: water, food, caffeine or timing. Occasionally they signal something urgent.',
    covers: ['common triggers', 'simple fixes to try', 'when a headache is urgent'],
    blocks: [
      { k: 'v', v: { type: 'bars', title: 'In adult Adderall XR trials', legend: ['Adderall XR', 'Placebo'], unit: '%', rows: [
        { label: 'Headache', a: 26, b: 13 }, { label: 'Dizziness', a: 7, b: 0 }
      ] }, cap: 'From the FDA label.' },
      { k: 'h', t: 'Common triggers' },
      { k: 'ul', items: [
        '**Not drinking enough.** Stimulants can dull thirst.',
        '**Skipped meals.** Low appetite plus low blood sugar is a classic headache recipe.',
        '**Caffeine swings.** Too much, or a sudden drop on weekends.',
        '**Jaw clenching** or teeth grinding during the day or at night.',
        '**Wearing off.** Some people get a headache as the dose fades.',
        '**Short sleep.**'
      ] },
      { k: 'h', t: 'Simple fixes to try' },
      { k: 'ol', items: [
        'A full glass of water and something to eat.',
        'Note when it starts relative to your dose. Bloodstream\'s curve shows whether you were at the peak or in the comedown.',
        'Keep caffeine steady from day to day rather than cutting it suddenly.',
        'Ask your pharmacist which over-the-counter pain reliever suits you.',
        'If headaches are frequent, check your blood pressure a few times and log the readings.'
      ] },
      { k: 'h', t: 'Dizziness' },
      { k: 'p', t: 'Stand up slowly, drink water and eat regularly. Feeling lightheaded every time you stand is worth reporting. Fainting is an emergency.' },
      { k: 'callout', tone: 'urgent', title: 'Call 911 for', t: 'A sudden, severe headache, or a headache with weakness, numbness, a drooping face, trouble speaking, confusion or vision loss. These can be signs of a stroke. Note the time it started.' }
    ],
    sources: [SRC.FDA_XR, SRC.STROKE, SRC.AHA_BP],
    related: ['heart', 'mouth', 'rebound']
  },

  {
    id: 'mood', section: 'Side effects', read: 7,
    title: 'Mood changes: flat, low, irritable or angry',
    dek: 'Some mood changes are tied to the dose and the time of day, and are among the most useful things to report. A few need a call soon.',
    covers: ['which mood changes are common', 'how dose and timing play a part', 'which signs need a call soon'],
    blocks: [
      { k: 'p', t: 'ADHD and emotions are closely linked. A large review found that trouble regulating emotions affects roughly a quarter to nearly half of children with ADHD and a third or more of adults. The right medication often helps with that. The wrong dose, or the wrong timing, can make it worse.' },
      { k: 'v', v: { type: 'compare',
        a: { title: 'Often dose or timing related', items: ['Flat, quiet or "zombie-like" around the peak', 'Irritable or teary as it wears off', 'Short fuse when hungry or tired', 'More serious than usual in social settings'] },
        b: { title: 'Call your prescriber soon', items: ['Sad or hopeless most days for two weeks or more', 'Angry outbursts or aggression that are new', 'Losing interest in things you enjoy', 'Others say your personality has changed'] }
      } },
      { k: 'h', t: 'Flat or "not myself"' },
      { k: 'p', t: 'Feeling emotionally muted, less funny or less spontaneous is a common complaint, and it often points to a dose that\'s more than you need. It\'s worth reporting even if your focus is great, because good treatment should leave you feeling like yourself.' },
      { k: 'h', t: 'Irritable or teary' },
      { k: 'p', t: 'Children in the XR trials had more emotional ups and downs than on placebo (9% vs 2%). Irritability often clusters in the comedown window, when the dose is fading. If that\'s the pattern, the rebound article has strategies, and timing changes may help.' },
      { k: 'h', t: 'Anger and aggression' },
      { k: 'p', t: 'The label tells prescribers to watch for new or worsening aggressive behavior or hostility. Keep a short note each time: when it happened, how long since the dose, and what set it off. A pattern is much easier to fix than a vague impression.' },
      { k: 'h', t: 'Low mood' },
      { k: 'p', t: 'Depression often travels with ADHD, so a low mood isn\'t automatically the medication. But it deserves attention either way. Stopping suddenly after high doses for a long time can also cause extreme tiredness and low mood, which is one reason not to stop on your own.' },
      { k: 'callout', tone: 'urgent', title: 'If you\'re thinking about hurting yourself', t: 'Call or text 988 any time to reach the Suicide & Crisis Lifeline. Call 911 if you are in immediate danger.' },
      { k: 'h', t: 'Using Bloodstream to spot the pattern' },
      { k: 'p', t: 'When you log a mood entry, glance at the phase on the dashboard: Building, Peak, Tapering or Comedown. Moods that keep landing in the same phase point to timing. Moods that show up regardless of the curve point elsewhere. Either way, it\'s exactly what your prescriber needs.' }
    ],
    sources: [SRC.FDA_XR, SRC.SHAW, SRC.LIFELINE, SRC.MEDLINE],
    related: ['rebound', 'area-emotion', 'psychosis']
  },

  {
    id: 'rebound', section: 'Side effects', read: 6,
    title: 'The comedown: rebound and the afternoon crash',
    dek: 'As a dose fades, some people get tired, snappy, hungry or low for a while. Why it happens, how to soften it, and what to ask about.',
    covers: ['why the crash happens', 'how to soften it', 'what to ask about timing'],
    blocks: [
      { k: 'p', t: '**Rebound** is what happens when ADHD symptoms return as the medication wears off, sometimes feeling stronger than usual for a while. Kelty Mental Health describes it as feeling edgy, irritable, reactive or agitated. Adults often describe it as an afternoon crash: tired, foggy and short-tempered.' },
      { k: 'v', v: { type: 'curve', kind: 'XR', show: 'effect', hours: 16, band: { from: 9, to: 12.5, label: 'Typical comedown window' }, marks: [{ h: 0, label: 'Dose' }] }, cap: 'For XR, the comedown typically lands 9 to 12 hours after the dose. For IR, it comes after 4 to 6 hours and can happen between doses. Bloodstream labels this phase Comedown on your dashboard.' },
      { k: 'h', t: 'Softening the landing' },
      { k: 'ul', items: [
        '**Eat before it hits.** A snack with protein in the hour before your usual comedown helps a lot of people, especially since appetite has been low all day.',
        '**Drink water.**',
        '**Plan lighter tasks** for that window. Save the hard conversations and decisions for when you have more in the tank.',
        '**Move.** A short walk or some time outside can take the edge off.',
        '**Tell the people around you.** "Around 5 I get short-tempered, it\'s the medication wearing off" prevents a lot of arguments.',
        '**Protect sleep.** A short night makes the next comedown worse.'
      ] },
      { k: 'h', t: 'What to ask about' },
      { k: 'p', t: 'Prescribers have several ways to smooth the curve, such as changing timing or the release type. These are their decisions to make, and the most useful thing you can bring is a clear picture: what time the comedown starts, how long it lasts, and what it feels like.' },
      { k: 'v', v: { type: 'check', title: 'Log a few comedowns', items: [
        'Time it started and how long since your dose',
        'What it felt like: tired, irritable, sad, hungry, foggy',
        'Whether you\'d eaten, and how you slept the night before',
        'How long until you felt normal again'
      ] } },
      { k: 'callout', tone: 'info', t: 'A comedown that is mild and predictable is common. One that is intense, involves aggression, or leaves you feeling hopeless deserves a call to your prescriber.' }
    ],
    sources: [SRC.KELTY, SRC.FDA_XR, SRC.FDA_IR],
    related: ['mood', 'area-energy', 'timing']
  },

  {
    id: 'anxiety', section: 'Side effects', read: 5,
    title: 'Anxiety, jitters and restlessness',
    dek: 'Stimulants can feel edgy, especially at the peak or with caffeine. What usually makes it worse, what calms it, and when to call.',
    covers: ['why stimulants can feel edgy', 'what makes it worse', 'calming strategies', 'when to call'],
    blocks: [
      { k: 'p', t: 'For some people, ADHD medication reduces anxiety, because life feels less chaotic. For others it adds a layer of nervous energy. Both are normal responses, and which one you get can depend on the dose, the time of day and what else is in the mix.' },
      { k: 'v', v: { type: 'bars', title: 'In Adderall XR trials', legend: ['Adderall XR', 'Placebo'], unit: '%', rows: [
        { label: 'Anxiety, adults', a: 8, b: 5 }, { label: 'Agitation, adults', a: 8, b: 5 }, { label: 'Nervousness, children', a: 6, b: 2 }, { label: 'Nervousness, teens', a: 6, b: 0 }
      ] }, cap: 'From the FDA label.' },
      { k: 'h', t: 'What tends to make it worse' },
      { k: 'ul', items: ['Caffeine or energy drinks on top of the dose', 'An empty stomach', 'Short sleep', 'A dose that is more than you need', 'An anxiety disorder that was there before the medication'] },
      { k: 'h', t: 'Calming it down in the moment' },
      { k: 'ol', items: [
        'Breathe out for longer than you breathe in, for a minute or two. It steadies the heart rate.',
        'Eat something and drink water.',
        'Walk, stretch or shake it out. Restless energy settles faster when it has somewhere to go.',
        'Skip the next coffee.',
        'Check the dashboard. If you\'re near the peak, it will likely ease within a couple of hours.'
      ] },
      { k: 'h', t: 'When to call' },
      { k: 'callout', tone: 'warn', t: 'Call your prescriber soon about panic attacks, anxiety that keeps you from doing normal things, or a shaky, wired feeling most days. Chest pain or fainting is an emergency.' },
      { k: 'p', t: 'When you report it, timing is the key detail. Anxiety that peaks a few hours after the dose suggests the medication. Anxiety that\'s worst in the morning before the dose, or all day regardless, points somewhere else.' }
    ],
    sources: [SRC.FDA_XR, SRC.FDA_CAFFEINE, SRC.NIMH],
    related: ['substances', 'heart', 'area-calm']
  },

  {
    id: 'tics', section: 'Side effects', read: 5,
    title: 'Tics, twitches and repetitive habits',
    dek: 'The 2023 label added tics and Tourette\'s to its warnings. What the research shows, and what to track so your prescriber can tell what\'s really going on.',
    covers: ['what the label says', 'what research shows for people with tics', 'what to track before your visit'],
    blocks: [
      { k: 'p', t: '**Tics** are sudden, repeated movements or sounds, like blinking, shrugging, sniffing or throat clearing. They are common in childhood, they often come and go on their own, and they frequently occur alongside ADHD.' },
      { k: 'h', t: 'What the label says' },
      { k: 'p', t: 'The current Adderall XR label lists new motor and verbal tics, and worsening of Tourette\'s syndrome, as possible effects of amphetamine. Prescribers are asked to ask about tics before starting and to watch for new or worsening ones during treatment.' },
      { k: 'h', t: 'What research shows' },
      { k: 'p', t: 'A 2018 Cochrane review of children with both ADHD and tic disorders found that stimulants haven\'t been shown to worsen tics in most people, and that both tics and ADHD symptoms often improved. It also noted individual cases where tics did get worse, including at high doses of dextroamphetamine in one small study. The evidence is limited, so watching your own pattern matters.' },
      { k: 'v', v: { type: 'check', title: 'Track for a week or two', items: [
        'Which tic: what it looks or sounds like',
        'Roughly how often, and whether it\'s new or a change in an old one',
        'Time of day, and where you were on the dose curve',
        'Stress, tiredness or illness that week, since these make tics worse too'
      ] }, cap: 'Because tics naturally wax and wane, a pattern across days is more meaningful than a single bad afternoon.' },
      { k: 'h', t: 'Skin picking, nail biting and hair pulling' },
      { k: 'p', t: 'Some people notice more repetitive, body-focused habits on stimulants, especially when concentrating. Keeping hands busy with a fidget, trimming nails and covering fingertips can help in the moment. Mention it to your prescriber, particularly if it\'s causing sores.' },
      { k: 'callout', tone: 'warn', t: 'Call soon about new tics, tics that are clearly getting worse, or habits that are causing injuries.' }
    ],
    sources: [SRC.FDA_XR, SRC.COCHRANE_TICS],
    related: ['anxiety', 'area-calm', 'appointments']
  },

  {
    id: 'circulation', section: 'Side effects', read: 5,
    title: 'Cold fingers and toes: circulation changes',
    dek: 'Stimulants can narrow small blood vessels in the hands and feet. Usually it\'s mild. Very rarely it isn\'t. How to tell the difference.',
    covers: ['what Raynaud\'s phenomenon looks like', 'how to stay comfortable', 'which signs need care right away'],
    blocks: [
      { k: 'p', t: 'The label calls it **peripheral vasculopathy**, which includes **Raynaud\'s phenomenon**: episodes where fingers or toes go cold and change color because blood flow drops for a while. It has been reported in all age groups, at normal doses, and at any point during treatment.' },
      { k: 'v', v: { type: 'cycle', title: 'A typical Raynaud\'s episode', steps: ['Cold or stress', 'Fingers turn white or pale', 'Then blue and numb', 'Red and tingly as blood returns'] }, cap: 'Not everyone sees all three colors. Episodes last minutes to an hour.' },
      { k: 'p', t: 'According to the label, symptoms are usually intermittent and mild, and they generally improve when the dose is lowered or the medicine is stopped. Very rarely, it has led to sores on fingers or toes or breakdown of the skin.' },
      { k: 'h', t: 'Staying comfortable' },
      { k: 'ul', items: ['Keep hands and feet warm: gloves, warm socks, layers, hand warmers in winter.', 'Warm your hands under lukewarm, not hot, water during an episode.', 'Avoid smoking and vaping, which narrow blood vessels further.', 'Take care with cold drinks, freezer aisles and air conditioning.'] },
      { k: 'callout', tone: 'urgent', title: 'Call your prescriber right away', t: 'If you notice sores or wounds on fingers or toes that you can\'t explain, skin that stays white or blue, or severe pain. Get urgent care if a finger or toe stays cold and discolored.' },
      { k: 'p', t: 'Mention milder episodes at your next visit too, along with how often they happen and whether they line up with your dose. Your prescriber may want to examine your hands or refer you to a specialist.' }
    ],
    sources: [SRC.FDA_XR, SRC.RAYNAUD],
    related: ['heart', 'skin', 'substances']
  },

  {
    id: 'skin', section: 'Side effects', read: 5,
    title: 'Skin, hair, sweat and eyes',
    dek: 'A grab bag of side effects that are usually minor, with two rashes that are emergencies.',
    covers: ['common skin and sweat changes', 'rashes that are emergencies', 'hair and vision changes'],
    blocks: [
      { k: 'h', t: 'Sweating' },
      { k: 'p', t: 'Excessive sweating is listed on the label. It\'s more likely around the peak, in the heat and with exercise. Breathable clothes, staying hydrated and an antiperspirant usually do the job. If it\'s heavy and comes with a fever, muscle stiffness or confusion, treat it as an emergency.' },
      { k: 'h', t: 'Rashes' },
      { k: 'p', t: 'An itchy rash or hives can be an allergic reaction to the medicine or something in the capsule. Call your prescriber soon about any new rash.' },
      { k: 'callout', tone: 'urgent', title: 'Emergency rashes', t: 'Get emergency care for a rash with blisters, peeling skin, or sores in the mouth, eyes or genitals, especially with fever (these can be Stevens-Johnson syndrome, which has been reported with amphetamine), or for hives with swelling of the face or throat or trouble breathing.' },
      { k: 'h', t: 'Hair' },
      { k: 'p', t: 'Hair thinning has been reported. It\'s also common with low food intake and weight loss, stress and other causes, so it\'s worth raising with your prescriber, who may check things like iron or thyroid levels.' },
      { k: 'h', t: 'Eyes and vision' },
      { k: 'p', t: 'Blurred vision and wider pupils are listed side effects. Mention them, and get urgent care for sudden eye pain, redness with blurred vision, or vision loss.' }
    ],
    sources: [SRC.FDA_XR, SRC.MEDLINE],
    related: ['emergency', 'circulation', 'mouth']
  },

  {
    id: 'mouth', section: 'Side effects', read: 5,
    title: 'Dry mouth, teeth grinding and taste',
    dek: 'Dry mouth is the most common side effect in adults on Adderall XR. It\'s more than an annoyance, because saliva protects your teeth.',
    covers: ['why your mouth feels dry', 'protecting your teeth', 'help for jaw clenching'],
    blocks: [
      { k: 'v', v: { type: 'bars', title: 'Dry mouth in adult Adderall XR trials', legend: ['Adderall XR', 'Placebo'], unit: '%', rows: [{ label: 'Dry mouth', a: 35, b: 5 }] }, cap: 'From the FDA label: the single most common side effect in adults.' },
      { k: 'p', t: 'Saliva washes away food and bacteria and neutralizes acids. With less of it, cavities and gum problems become more likely, especially if you sip sugary drinks or snack through the day to keep energy up.' },
      { k: 'h', t: 'What helps (NIDCR)' },
      { k: 'ul', items: [
        'Sip water through the day and keep a bottle nearby.',
        'Chew sugar-free gum or suck sugar-free mints, ideally with xylitol, to get saliva flowing.',
        'Go easy on caffeine, alcohol and tobacco, which dry the mouth further.',
        'Use a humidifier at night if you wake with a dry mouth.',
        'Brush with fluoride toothpaste and see a dentist regularly. Tell them you take a stimulant.'
      ] },
      { k: 'h', t: 'Teeth grinding and jaw clenching' },
      { k: 'p', t: 'Bruxism, grinding or clenching the teeth, is on the label. Signs include a sore jaw, headaches near the temples, or worn teeth. Noticing it is half the battle: try "lips together, teeth apart" when you catch yourself. A dentist can fit a night guard if it happens in your sleep.' },
      { k: 'h', t: 'A strange taste' },
      { k: 'p', t: 'An unpleasant or altered taste is also listed. It\'s usually harmless and can improve with water, sugar-free gum and good oral hygiene. Mention it if it\'s putting you off food.' }
    ],
    sources: [SRC.FDA_XR, SRC.NIDCR],
    related: ['headache', 'appetite', 'skin']
  },

  {
    id: 'sexual', section: 'Side effects', read: 5,
    title: 'Sex drive, erections, periods and urinary health',
    dek: 'Changes the label reports, the one symptom that is an emergency, and what to know about periods, birth control and pregnancy.',
    covers: ['changes the label reports', 'the symptom that is an emergency', 'periods, birth control and pregnancy'],
    blocks: [
      { k: 'p', t: 'These can be awkward to bring up, which is exactly why they often go unmentioned. Prescribers hear about them all the time, and many have practical solutions.' },
      { k: 'h', t: 'What the label reports' },
      { k: 'ul', items: ['Changes in sex drive, up or down', 'Trouble getting or keeping an erection', 'Frequent or prolonged erections', 'Urinary tract infections, reported in 5% of adults in the XR trials vs none on placebo'] },
      { k: 'callout', tone: 'urgent', title: 'Emergency', t: 'An erection that lasts longer than four hours, or is painful, needs emergency care right away to prevent lasting damage.' },
      { k: 'h', t: 'Periods and hormones' },
      { k: 'p', t: 'Some people report that their medication feels weaker in the week before their period. Research on this is still limited, but noting it in Bloodstream alongside your cycle can help you and your prescriber see whether there\'s a pattern.' },
      { k: 'h', t: 'Birth control' },
      { k: 'p', t: 'Amphetamine isn\'t known to make hormonal birth control less effective. Your pharmacist can confirm this for your specific method and any other medicines you take.' },
      { k: 'h', t: 'Pregnancy and breastfeeding' },
      { k: 'p', t: 'Tell your prescriber if you\'re pregnant, breastfeeding or planning a pregnancy. Data in pregnancy are limited, and the label advises against breastfeeding because amphetamine passes into breast milk. The National Pregnancy Registry for ADHD Medications collects data to improve this advice.' },
      { k: 'v', v: { type: 'check', title: 'Making it easier to raise', items: ['Log it as a priority entry so it\'s on your list', 'Use the exact words: "I\'ve noticed changes in my sex drive"', 'Say when it started relative to starting or changing the dose'] } }
    ],
    sources: [SRC.FDA_XR, SRC.MEDLINE, SRC.PREG_REG],
    related: ['appointments', 'emergency', 'interactions']
  },

  {
    id: 'growth', section: 'Side effects', read: 6,
    title: 'Growth, height and weight in kids and teens',
    dek: 'Stimulants can slow growth a little in some children. What studies found, how it\'s monitored, and what to ask about breaks.',
    covers: ['what studies found', 'how growth is monitored', 'questions about breaks from medication'],
    blocks: [
      { k: 'p', t: 'Parents ask about this more than almost anything else, and it\'s a fair question. Here is what is known, and what isn\'t.' },
      { k: 'v', v: { type: 'stats', items: [
        { value: '~2 cm', label: 'Less height growth over 3 years with daily, year-round stimulant use (average)' },
        { value: '~2.7 kg', label: 'Less weight gain over the same period (average)' },
        { value: 'Every visit', label: 'How often prescribers should check height and weight' }
      ] }, cap: 'Figures from long-term studies summarized in FDA stimulant labeling, mostly with methylphenidate. The Adderall label expects amphetamine to have a similar effect.' },
      { k: 'h', t: 'What that means' },
      { k: 'p', t: 'The average effect is small, and many children follow their expected growth curve without any problem. But averages hide individuals: a child who eats very little on medication may slow more. That\'s why the label asks prescribers to monitor height and weight closely, and to consider interrupting treatment for a child who isn\'t growing or gaining weight as expected.' },
      { k: 'h', t: 'How it\'s monitored' },
      { k: 'ul', items: ['Height and weight at each visit, plotted on a growth chart', 'Looking at the trend across visits, not one measurement', 'Asking about appetite, meals and energy'] },
      { k: 'h', t: 'What parents can do' },
      { k: 'ul', items: ['Use the appetite strategies: breakfast before the dose, calorie-dense snacks, a second supper.', 'Weigh on the same scale, at the same time of day, if you track at home.', 'Bring meal notes from Bloodstream to visits.'] },
      { k: 'h', t: 'Breaks from medication' },
      { k: 'p', t: 'Some families and prescribers use planned breaks on weekends or over summer, partly to help with appetite and growth. Others find the cost to schoolwork, relationships and safety too high. It\'s a trade-off to weigh with your prescriber rather than something to decide alone.' },
      { k: 'callout', tone: 'warn', t: 'Call soon if your child is losing weight, isn\'t gaining weight, or a growth check shows them dropping across growth curve lines.' }
    ],
    sources: [SRC.FDA_XR, SRC.AAP, SRC.CHC_APPETITE],
    related: ['appetite', 'appointments', 'area-appetite']
  }
];
