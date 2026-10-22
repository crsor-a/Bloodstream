import type { Article } from '../types';
import { SRC } from '../sources';

export const SAFETY: Article[] = [
  {
    id: 'emergency', section: 'Safety', read: 6,
    title: 'When to get help right away',
    dek: 'Most side effects can wait for a phone call or your next visit. A short list can\'t. Here is how to tell them apart, and what to say when you call.',
    covers: ['which symptoms need emergency care', 'what to tell responders', 'what to do once you\'re safe'],
    blocks: [
      { k: 'p', t: 'Adderall is used safely by millions of people, and serious reactions are rare. Rare is not never, though, and the warning signs below are the ones the FDA label and Medication Guide single out. If one of them is happening, the right move is to get help first and sort out the details later.' },
      { k: 'v', v: { type: 'ladder', steps: [
        { level: 'emergency', title: 'Call 911 now', t: 'Chest pain, fainting, trouble breathing, stroke signs, a seizure, swelling of the face or throat, a blistering rash, overheating with confusion, thoughts of suicide.' },
        { level: 'stop', title: 'Stop and call today', t: 'Seeing or hearing things, intense suspicion, days without needing sleep, unexplained sores on fingers or toes.' },
        { level: 'soon', title: 'Call this week', t: 'A racing heart that keeps happening, new tics, weight loss you didn\'t expect, low mood most days.' },
        { level: 'mention', title: 'Bring it to your visit', t: 'Trouble sleeping, less appetite, headaches, a crash in the afternoon.' }
      ] }, cap: 'How Bloodstream sorts what you log. The color on each entry in your library matches this ladder.' },
      { k: 'h', t: 'Call 911 or go to an emergency room' },
      { k: 'ul', items: [
        '**Chest pain, pressure or tightness**, especially if it spreads to your arm, jaw or back, or comes with sweating or nausea.',
        '**Fainting**, or nearly fainting, or a heartbeat that feels very fast or chaotic and doesn\'t settle.',
        '**New shortness of breath** that isn\'t explained by exercise.',
        '**Stroke signs**: a drooping face, one arm drifting down, slurred speech, sudden loss of vision or balance, or the worst headache of your life. Note the time it started.',
        '**A seizure**, especially a first one, one that lasts longer than five minutes, or one where the person doesn\'t wake up normally.',
        '**Swelling of the face, lips, tongue or throat**, hives with trouble breathing, or feeling faint after a dose. These are signs of a severe allergic reaction.',
        '**A rash with blisters, peeling or sores in the mouth or eyes**, often with fever.',
        '**Overheating with confusion**: very high temperature, stiff or twitching muscles, heavy sweating, shivering or agitation. This can be serotonin syndrome when Adderall is combined with certain antidepressants or migraine medicines.',
        '**An erection that lasts more than four hours.**',
        '**Severe belly pain**, vomiting blood, or black or bloody stools.',
        '**Taking far more than prescribed** and feeling unwell: pounding heart, confusion, hallucinations or high fever.'
      ] },
      { k: 'callout', tone: 'urgent', title: 'Thoughts of suicide or self-harm', t: 'Call or text **988** to reach the Suicide & Crisis Lifeline any time, day or night. If you are in immediate danger, call 911. You don\'t have to be sure it\'s serious to reach out.' },
      { k: 'h', t: 'If you took extra but feel fine' },
      { k: 'p', t: 'Call **Poison Control at 1-800-222-1222** (US). It\'s free, confidential and staffed by pharmacists and nurses around the clock. They will tell you whether to stay home and watch for symptoms or get checked. Don\'t take your next dose until you\'ve spoken with them or your prescriber.' },
      { k: 'h', t: 'Why the heart warnings exist' },
      { k: 'p', t: 'Stimulants raise heart rate and blood pressure a little in most people. The label reports sudden death in people with underlying structural heart problems, and stroke and heart attack in adults, which is why prescribers ask about heart history before starting. These events are very uncommon, but chest pain, fainting and new breathlessness are never symptoms to wait out.' },
      { k: 'h', t: 'What to tell responders' },
      { k: 'v', v: { type: 'check', title: 'Have this ready', items: [
        'The medicine: Adderall or a generic, IR or XR, and the strength in mg',
        'When you took your last dose, and how many you took today',
        'Every other medicine, supplement or substance taken in the last day or two',
        'When the symptoms started and whether they are getting worse',
        'Any heart condition, seizures or mental health history'
      ] }, cap: 'Bloodstream\'s Doses list shows your recent doses and times, which is quicker than remembering under stress.' },
      { k: 'h', t: 'Once you\'re safe' },
      { k: 'ul', items: [
        'Tell your prescriber what happened before taking another dose. Don\'t restart on your own.',
        'Log it in Bloodstream as a priority entry so it\'s at the top of your list for the next visit.',
        'You or your prescriber can report serious side effects to the FDA through MedWatch. Reports help spot rare problems.'
      ] }
    ],
    sources: [SRC.FDA_XR, SRC.AHA_HA, SRC.STROKE, SRC.LIFELINE, SRC.POISON, SRC.SEROTONIN, SRC.MEDWATCH],
    related: ['heart', 'safety', 'psychosis']
  },

  {
    id: 'safety', section: 'Safety', read: 7,
    title: 'Storage, sharing and misuse',
    dek: 'Adderall carries the FDA\'s strongest warning about misuse. What that means in practice, and the simple habits that keep you and the people around you safe.',
    covers: ['safe storage and disposal', 'what to do if you took extra', 'signs that use is drifting', 'why sharing is risky'],
    blocks: [
      { k: 'p', t: 'Every prescription stimulant has a **boxed warning**, the most serious kind of warning the FDA puts on a label. In 2023 the FDA updated it for the whole class. In plain terms: these medicines have a high potential for misuse, misuse can lead to a substance use disorder, including addiction, and taking more than prescribed can cause overdose and death.' },
      { k: 'p', t: 'That warning is about how the medicine is used, not a verdict on the people who take it. Taken as prescribed, for diagnosed ADHD, with regular check-ins, the risk is low. Most of the danger comes from taking it differently: more of it, more often, crushed and snorted, or by someone it wasn\'t prescribed for.' },
      { k: 'v', v: { type: 'stats', items: [
        { value: 'Schedule II', label: 'Federal category with the tightest prescribing rules for medicines' },
        { value: '2023', label: 'FDA updated the boxed warning for every prescription stimulant' },
        { value: 'Never', label: 'Share a dose, even once, even with a friend who has ADHD' }
      ] } },
      { k: 'h', t: 'Store it like it matters' },
      { k: 'ul', items: [
        'Keep it out of sight and out of reach, ideally locked, especially with children, teens or visitors in the house.',
        'Leave it in the original labeled bottle. It proves the prescription is yours if you\'re ever asked.',
        'Know roughly how many are left. Missing pills are easy to notice when you check now and then.',
        'Don\'t leave it in a car or a bag that gets handed around. Heat and humidity can also damage it.'
      ] },
      { k: 'h', t: 'Why sharing is risky' },
      { k: 'p', t: 'Giving or selling a Schedule II medicine is illegal, but the bigger issue is safety. The person you share with hasn\'t been screened for heart problems, bipolar disorder or interacting medicines, and the FDA notes that sharing is one of the main paths to misuse. If someone asks, a simple line works: "It\'s prescribed for me, so I can\'t give it out."' },
      { k: 'h', t: 'If you took more than you meant to' },
      { k: 'ol', items: [
        'If you feel unwell, especially a pounding heart, chest pain, confusion or a very high temperature, call 911.',
        'If you feel fine, call Poison Control at 1-800-222-1222 or your pharmacist. Tell them the strength, how many and when.',
        'Skip your next dose until a professional says otherwise, and expect trouble sleeping tonight.',
        'Log it so your prescriber knows. Mix-ups happen, and they are easier to prevent once someone knows about them.'
      ] },
      { k: 'h', t: 'Signs that use is drifting' },
      { k: 'p', t: 'Misuse rarely starts dramatically. It tends to creep in. Watch for these in yourself, or in someone you care for:' },
      { k: 'ul', items: [
        'Taking extra to feel the effect, or because one dose "isn\'t enough anymore".',
        'Running out before the refill date.',
        'Using it to stay up all night, to party, or to lose weight.',
        'Hiding how much you take, or feeling uneasy when someone asks.',
        'Strong cravings, or feeling unable to function without more.'
      ] },
      { k: 'callout', tone: 'warn', title: 'Talking about it helps', t: 'Your prescriber has seen this before and would much rather hear it early. If you want to talk to someone outside your care team first, the SAMHSA National Helpline (1-800-662-4357) is free, confidential and open all day, every day.' },
      { k: 'h', t: 'Pills that don\'t come from a pharmacy' },
      { k: 'p', t: 'The FDA warns that stimulants sold online or by individuals are often counterfeit, and some contain fentanyl or methamphetamine. During shortages this temptation goes up. Only use medicine dispensed by a licensed pharmacy.' },
      { k: 'h', t: 'Getting rid of leftovers' },
      { k: 'p', t: 'Drug take-back sites (many pharmacies have drop boxes) are the best option. The DEA also runs national Take Back Days. If none is near you, the FDA\'s at-home method works: mix the pills with something unappealing like used coffee grounds or cat litter, seal it in a bag, and put it in the trash. Scratch out your name on the bottle before recycling it.' }
    ],
    sources: [SRC.FDA_2023, SRC.FDA_XR, SRC.FDA_DISPOSAL, SRC.DEA_TAKEBACK, SRC.SAMHSA, SRC.POISON],
    related: ['missed', 'substances', 'emergency']
  },

  {
    id: 'psychosis', section: 'Safety', read: 6,
    title: 'Seeing, hearing or believing things that aren\'t real',
    dek: 'Psychosis and mania are rare on stimulants, but they are the reason the label asks for a call right away. What the symptoms look like, who is more at risk, and what usually happens next.',
    covers: ['symptoms to watch for', 'who is at higher risk', 'what usually happens next'],
    blocks: [
      { k: 'p', t: '**Psychosis** means losing touch with what\'s real: hearing voices, seeing things others don\'t, or holding beliefs that aren\'t true, like being watched or followed. **Mania** is a different but related state: very high energy, little need for sleep, racing thoughts, and big, risky decisions. Both are uncommon on Adderall. Both need a prompt response.' },
      { k: 'v', v: { type: 'stats', items: [
        { value: '~0.1%', label: 'Psychotic or manic symptoms in pooled short-term stimulant trials (label)' },
        { value: '1 in 660', label: 'New psychosis among young people starting a stimulant (NEJM, 2019)' },
        { value: '~2x', label: 'Higher rate with amphetamine than with methylphenidate in that study' }
      ] }, cap: 'The NEJM study followed more than 220,000 patients aged 13 to 25. Rates were about 0.2% for amphetamine and 0.1% for methylphenidate.' },
      { k: 'h', t: 'What it can look like' },
      { k: 'ul', items: [
        'Hearing voices or sounds, or seeing things, that other people don\'t.',
        'Feeling watched, followed, or that others are plotting against you.',
        'Beliefs that feel completely certain but that people close to you find strange.',
        'Going days with very little sleep and not feeling tired.',
        'Thoughts racing faster than you can speak them; jumping between ideas.',
        'Feeling unstoppable, spending big, or taking risks that aren\'t like you.'
      ] },
      { k: 'p', t: 'It is often easier for someone else to notice these changes than for the person going through them. If a parent, partner or friend says you don\'t seem like yourself, it\'s worth listening.' },
      { k: 'h', t: 'Who is more at risk' },
      { k: 'ul', items: [
        'A personal or family history of **bipolar disorder**, psychosis or schizophrenia. The label tells prescribers to screen for this before starting.',
        'Higher doses, or taking more than prescribed.',
        'Severe sleep loss, which can trigger symptoms on its own.',
        'Other substances, especially high-potency cannabis and other stimulants.'
      ] },
      { k: 'callout', tone: 'urgent', title: 'What to do', t: 'Stop taking the medication and contact your prescriber today. If anyone could be hurt, or the person can\'t stay safe, call 911. For thoughts of suicide, call or text 988.' },
      { k: 'h', t: 'What usually happens next' },
      { k: 'p', t: 'Your prescriber will want to see you, rule out other causes, and decide whether to stop the stimulant for good, try a lower dose later, or switch to a different medicine such as a non-stimulant. In many reported cases, stimulant-related symptoms ease after the medicine is stopped, but that call belongs to a clinician who can assess you in person.' },
      { k: 'h', t: 'What to note in your log' },
      { k: 'v', v: { type: 'check', title: 'Useful details for your prescriber', items: [
        'When the symptoms started, and whether they come and go with your doses',
        'How much you\'ve been sleeping the past week',
        'Any changes in dose or timing, or extra doses',
        'Caffeine, alcohol, cannabis or other substances',
        'Family history of bipolar disorder or psychosis, if you know it'
      ] } }
    ],
    sources: [SRC.FDA_XR, SRC.NEJM_PSYCH, SRC.MEDLINE, SRC.LIFELINE],
    related: ['mood', 'emergency', 'sleep']
  },

  {
    id: 'heart', section: 'Safety', read: 7,
    title: 'Heart rate and blood pressure',
    dek: 'A small rise is expected. How small, how to check your own numbers properly, and which symptoms should never be waited out.',
    covers: ['what changes are expected', 'how to check your own numbers', 'which symptoms are urgent', 'questions about family history'],
    blocks: [
      { k: 'p', t: 'Amphetamine acts on the same signaling system that speeds your heart up during exercise or stress. So a modest rise in heart rate and blood pressure is a normal, expected effect, not a sign that something has gone wrong. The question is how much, and whether it stays that way.' },
      { k: 'v', v: { type: 'stats', items: [
        { value: '+2 to 4', label: 'Average rise in blood pressure, mm Hg (label)' },
        { value: '+3 to 6', label: 'Average rise in heart rate, beats per minute (label)' },
        { value: '6%', label: 'Adults in XR trials with a fast heartbeat, vs 3% on placebo' }
      ] }, cap: 'Averages hide individual differences. The label notes that some people have larger increases, which is why checking matters.' },
      { k: 'h', t: 'Before you started' },
      { k: 'p', t: 'Prescribers ask about fainting, chest pain, heart murmurs, high blood pressure and family history of sudden death or heart rhythm problems. If any of that changes, for example a relative is diagnosed with a heart condition, let your prescriber know even if you feel fine.' },
      { k: 'h', t: 'Checking your own numbers' },
      { k: 'p', t: 'A home blood pressure cuff (upper-arm style) is inexpensive and gives your prescriber real data instead of a single reading taken in a stressful office.' },
      { k: 'ol', items: [
        'Sit quietly for five minutes, feet flat, back supported, arm resting at heart height.',
        'No caffeine, exercise or nicotine in the 30 minutes before.',
        'Take two readings a minute apart and write both down.',
        'Measure once before your dose and once around your peak. Bloodstream\'s Peak level tile shows when that is (about 3 hours for IR, about 7 for XR).',
        'Repeat on a few different days. One high reading on its own means little.'
      ] },
      { k: 'v', v: { type: 'scale', title: 'Adult blood pressure categories (top number)', unit: 'mm Hg', min: 90, max: 190, segs: [
        { label: 'Normal', to: 120, tone: 'ok' }, { label: 'Elevated', to: 130, tone: 'mid' },
        { label: 'Stage 1', to: 140, tone: 'warn' }, { label: 'Stage 2', to: 180, tone: 'bad' }, { label: 'Crisis', to: 190, tone: 'bad' }
      ] }, cap: 'American Heart Association categories for adults. The bottom number counts too: 80 to 89 is Stage 1, 90 or more is Stage 2. Children and teens use different, age-based charts.' },
      { k: 'callout', tone: 'urgent', title: 'Don\'t wait these out', t: 'Chest pain, fainting or new shortness of breath: call 911. A reading above 180/120 with headache, chest pain, vision changes or confusion is also an emergency.' },
      { k: 'h', t: 'Worth a call this week' },
      { k: 'ul', items: [
        'A racing, pounding or fluttering heartbeat that keeps coming back.',
        'Home readings that are consistently higher than before you started.',
        'Getting dizzy or lightheaded when you stand up.'
      ] },
      { k: 'h', t: 'Things that stack on top' },
      { k: 'p', t: 'Caffeine, nicotine, energy drinks and decongestants such as pseudoephedrine all push the same system. Dehydration and heat do too. If your heart feels busy, those are the first things to look at, and they are useful to note in your log.' },
      { k: 'h', t: 'Exercise' },
      { k: 'p', t: 'Exercise is generally encouraged and helps ADHD symptoms on its own. Drink water, take care in the heat, and stop and get checked if you have chest pain, faintness or unusual breathlessness during exertion. If you play competitive sports, ask your prescriber whether any extra screening makes sense for you.' }
    ],
    sources: [SRC.FDA_XR, SRC.AHA_BP, SRC.AHA_HA, SRC.FDA_CAFFEINE],
    related: ['emergency', 'substances', 'anxiety']
  },

  {
    id: 'interactions', section: 'Safety', read: 7,
    title: 'Medicines and supplements that interact',
    dek: 'One combination is never allowed, a few need a careful plan, and some everyday things quietly change how strong your dose is. A plain guide to all three.',
    covers: ['the combination that is never allowed', 'medicines that need a check first', 'how stomach acid changes levels'],
    blocks: [
      { k: 'p', t: 'Your pharmacy system checks for interactions, but only with the medicines it knows about. Over-the-counter products, supplements and prescriptions filled elsewhere slip through. This article covers what the Adderall label flags, so you know what to ask about.' },
      { k: 'h', t: 'Never together: MAOIs' },
      { k: 'callout', tone: 'urgent', t: '**Monoamine oxidase inhibitors (MAOIs)** must not be taken with Adderall or within **14 days** of stopping one. The combination can cause a dangerous spike in blood pressure. MAOIs include the antidepressants phenelzine, tranylcypromine and isocarboxazid, selegiline, and two hospital medicines that act like MAOIs: the antibiotic linezolid and intravenous methylene blue.' },
      { k: 'h', t: 'Needs a plan and watching: serotonin medicines' },
      { k: 'p', t: 'Combining amphetamine with other medicines that raise serotonin can, rarely, cause **serotonin syndrome**. Many people take these combinations safely under supervision, so this isn\'t a reason to stop anything on your own. It\'s a reason to know the warning signs.' },
      { k: 'ul', items: [
        'SSRIs and SNRIs (common antidepressants such as sertraline, fluoxetine, escitalopram, venlafaxine)',
        'Triptans for migraine',
        'Tricyclic antidepressants, lithium, buspirone',
        'Tramadol and fentanyl',
        'Tryptophan and St. John\'s wort'
      ] },
      { k: 'p', t: 'Warning signs include agitation, confusion, a racing heart, sweating, shivering, muscle twitching or stiffness, and a high temperature. If they appear, get emergency care.' },
      { k: 'h', t: 'Medicines that can raise your level' },
      { k: 'p', t: 'Some medicines slow down **CYP2D6**, the liver enzyme that helps break amphetamine down. Paroxetine, fluoxetine, bupropion, quinidine and ritonavir are examples. With these, the same dose can act stronger and longer, so prescribers may adjust and watch more closely.' },
      { k: 'h', t: 'Stomach and urine acidity' },
      { k: 'v', v: { type: 'compare',
        a: { title: 'Can raise or prolong levels', items: ['Antacids and sodium bicarbonate', 'Acetazolamide and some thiazide diuretics', 'Acid-reducing medicines can change XR timing'] },
        b: { title: 'Can lower or shorten levels', items: ['Vitamin C (ascorbic acid)', 'Fruit juices and very acidic drinks', 'Urine-acidifying products such as ammonium chloride'] }
      }, cap: 'Amphetamine is absorbed and cleared differently depending on acidity. The XR label specifically says to avoid taking it with antacids.' },
      { k: 'p', t: 'This is one reason the same dose can feel different from day to day. If you take vitamin C or drink juice with breakfast and your dose seems weak, try separating them by an hour or so and see whether it changes. Note what you tried in Bloodstream.' },
      { k: 'h', t: 'Other combinations to mention' },
      { k: 'ul', items: [
        '**Decongestants** like pseudoephedrine and phenylephrine add stimulation: a faster heart and more jitters.',
        '**Blood pressure medicines** may work less well, since amphetamine pushes blood pressure up.',
        '**Seizure medicines**: amphetamine can affect how some are absorbed, and stimulants can lower the seizure threshold.',
        '**Opioids, sedatives and alcohol**: the FDA advises against mixing stimulants with other controlled substances.'
      ] },
      { k: 'v', v: { type: 'check', title: 'Your interaction check', items: [
        'Make one list of everything you take, including vitamins, supplements and sleep aids',
        'Ask your pharmacist to run it, especially when anything new is added',
        'Tell every prescriber and dentist that you take Adderall',
        'Check before using cold, allergy or weight-loss products'
      ] } }
    ],
    sources: [SRC.FDA_XR, SRC.MEDLINE, SRC.SEROTONIN, SRC.FDA_2023],
    related: ['substances', 'timing', 'emergency']
  },

  {
    id: 'substances', section: 'Safety', read: 6,
    title: 'Caffeine, alcohol, cannabis and nicotine',
    dek: 'The everyday substances that people most often combine with Adderall, what each one does to the mix, and the honest version of how to talk about it.',
    covers: ['how caffeine adds up', 'why alcohol is riskier than it feels', 'what cannabis and nicotine change', 'what to tell your prescriber'],
    blocks: [
      { k: 'h', t: 'Caffeine' },
      { k: 'p', t: 'Caffeine and amphetamine are both stimulants, and their effects add together: a faster heart, more jitters, more anxiety and later sleep. A morning coffee is fine for many people, but the effect of a second or third cup on top of a peaking dose can surprise you.' },
      { k: 'v', v: { type: 'bars', title: 'Caffeine in common drinks (mg)', unit: 'mg', rows: [
        { label: 'Cola, 12 oz', a: 35 }, { label: 'Tea, 8 oz', a: 40 }, { label: 'Coffee, 8 oz', a: 95 },
        { label: 'Energy drink, 16 oz', a: 160 }, { label: 'Large coffee, 20 oz', a: 240 }
      ] }, cap: 'Typical values; brands vary a lot. The FDA cites about 400 mg a day as an amount not generally linked to harm in healthy adults. That guidance isn\'t for children or teens, and it doesn\'t account for a stimulant medicine.' },
      { k: 'ul', items: [
        'Keep caffeine earlier in the day, before your dose peaks if possible.',
        'If you feel wired, shaky or anxious, cutting caffeine is the easiest experiment.',
        'Energy drinks and pre-workout powders can hold several coffees\' worth.'
      ] },
      { k: 'h', t: 'Alcohol' },
      { k: 'p', t: 'The FDA advises against mixing stimulants with alcohol. The problem is that each one hides the other. Amphetamine can blunt the drowsy feeling of alcohol, so people drink more than they realize and feel less drunk than they are. Both strain the heart, both disturb sleep, and the combination can make the evening comedown and the next day worse.' },
      { k: 'callout', tone: 'warn', t: 'If you do drink, be honest with your prescriber about how much and when. It changes the advice they give, and it isn\'t something they will judge you for.' },
      { k: 'h', t: 'Cannabis' },
      { k: 'p', t: 'Cannabis can work against what the medication is helping with: short-term memory, motivation and focus. It can raise heart rate on top of a stimulant, and it can worsen anxiety. Heavy use of high-potency products is linked with psychosis, which is also a rare stimulant risk. If you use it, tell your prescriber so they can factor it in.' },
      { k: 'h', t: 'Nicotine and vaping' },
      { k: 'p', t: 'Nicotine is a stimulant too. It raises heart rate and blood pressure and can add to the jittery, wired feeling. It also narrows small blood vessels, which matters if you notice cold fingers or toes on Adderall.' },
      { k: 'h', t: 'Other stimulants and party drugs' },
      { k: 'p', t: 'Combining Adderall with cocaine, MDMA, methamphetamine or similar drugs sharply raises the risk of heart rhythm problems, overheating, seizures and psychosis. Pills bought outside a pharmacy may be counterfeit and contain fentanyl.' },
      { k: 'v', v: { type: 'check', title: 'Questions worth asking', items: [
        'How much caffeine is reasonable with my dose?',
        'If I drink at a social event, what should I keep in mind?',
        'Could anything I use be affecting how my medication works?'
      ] } }
    ],
    sources: [SRC.FDA_CAFFEINE, SRC.FDA_2023, SRC.NIAAA, SRC.FDA_XR, SRC.SAMHSA],
    related: ['interactions', 'heart', 'anxiety']
  },

  {
    id: 'missed', section: 'Everyday', read: 5,
    title: 'Missed, late or doubled doses',
    dek: 'What to do when you forget, remember late, or aren\'t sure whether you already took it.',
    covers: ['what to do after a missed dose', 'why a late dose affects sleep', 'what to do after a double dose'],
    blocks: [
      { k: 'p', t: 'Missing a dose of Adderall isn\'t dangerous. You\'ll likely have a harder day, and that\'s about it. Taking a dose too late, or twice, causes more trouble, mostly with sleep and side effects.' },
      { k: 'h', t: 'If you forgot' },
      { k: 'p', t: 'MedlinePlus gives the general rule: take the missed dose when you remember, but if it\'s almost time for the next one, skip it and carry on with your usual schedule. Don\'t take two doses to make up for one.' },
      { k: 'p', t: 'Stimulants add a twist, because how late you take them decides how late they keep working. The label advises against afternoon doses of Adderall XR because of insomnia. Ask your prescriber for your personal cut-off time, the time after which you should just skip the day\'s dose.' },
      { k: 'v', v: { type: 'day', title: 'Why the clock matters (XR)', from: 6, to: 24, items: [
        { h: 8, label: 'Usual dose', tone: 'dose' }, { h: 13, label: 'Late dose', tone: 'warn' }, { h: 22.5, label: 'Bedtime', tone: 'sleep' }
      ], band: { from: 8.5, to: 19, label: 'Typical felt effect from an 8 AM dose' } }, cap: 'Taken at 1 PM instead of 8 AM, the same capsule would still be working well past bedtime. Bloodstream\'s sleep card shows this for your own times.' },
      { k: 'h', t: 'If you\'re not sure whether you took it' },
      { k: 'ul', items: [
        'Check Bloodstream\'s Doses list or your calendar first. That\'s exactly what it\'s there for.',
        'If you still don\'t know, the safer choice is usually to skip rather than risk a double dose.',
        'A weekly pill organizer makes this question disappear.'
      ] },
      { k: 'h', t: 'If you took a double dose' },
      { k: 'ol', items: [
        'Don\'t panic, and don\'t take anything to "counteract" it.',
        'If you feel unwell, with a racing heart, chest pain, confusion or a high temperature, call 911.',
        'If you feel fine, call Poison Control at 1-800-222-1222 or your pharmacist for advice.',
        'Expect more side effects than usual and a late night. Skip caffeine.',
        'Log both doses in Bloodstream so the curve reflects what\'s really in your system, and tell your prescriber.'
      ] },
      { k: 'h', t: 'Making misses rarer' },
      { k: 'p', t: 'Save your usual dose as a medication in Bloodstream, add a schedule, and turn on reminders. If you add the schedule to your Calendar app, you\'ll get alerts even when Bloodstream is closed. Keeping the bottle next to something you do every morning, like your toothbrush or coffee maker, works surprisingly well too.' }
    ],
    sources: [SRC.MEDLINE, SRC.FDA_XR, SRC.POISON],
    related: ['timing', 'safety', 'sleep']
  }
];
