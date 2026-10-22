import type { Article, Block } from '../types';
import { SRC } from '../sources';

/**
 * Areas of functioning. Each article starts with a live "now" panel for its effectivity bar,
 * and its strategy section changes with the zone the bar is in (low / mid / high).
 */
const MECH = 'Amphetamine raises the amount of two chemical messengers, **dopamine** and **norepinephrine**, in the spaces between brain cells, by releasing more of them and slowing their cleanup. Those messengers matter most in the networks behind attention, planning and self-control, which tend to be underpowered in ADHD.';

const h = (t: string): Block => ({ k: 'h', t });
const p = (t: string): Block => ({ k: 'p', t });
const ul = (...items: string[]): Block => ({ k: 'ul', items });

export const AREAS: Article[] = [
  {
    id: 'area-focus', area: 'area-focus', section: 'Areas of functioning', read: 6,
    title: 'Focus',
    dek: 'Holding attention on what you chose, for as long as you need it. What changes on medication, what to do with the zone you\'re in right now, and what works without it.',
    covers: ['what focus is and why ADHD affects it', 'how the medication helps', 'strategies for your current zone', 'what to tell your prescriber'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('Focus in ADHD isn\'t about not being able to pay attention. It\'s about steering it. Interesting things grab attention easily, sometimes too easily (hyperfocus), while important but dull things slide away. The effort it takes to stay on a boring task is the part that ADHD makes expensive.'),
      h('How the medication helps'),
      p(MECH + ' In practice, people describe it as the dull task getting a little less dull and distractions losing some of their pull. It doesn\'t choose what you focus on, which is why structure still matters.'),
      { k: 'byZone',
        low: [h('Near baseline: borrow structure'), p('Medication support is low right now, so lean on the environment to do the work.'),
          ul('Pick one small, concrete task and write it down where you can see it.', 'Work in short sprints: 10 to 15 minutes, then a two-minute break.', 'Put your phone in another room, or use a site blocker.', 'Work next to someone else, in person or on a video call ("body doubling").', 'Save the demanding work for when your bar is higher, if your day allows it.')],
        mid: [h('Partial support: build momentum'), p('There\'s real support, but not the full amount. Good for steady work with a little scaffolding.'),
          ul('Start with the task you can make progress on fastest, then ride that momentum.', 'Use 25-minute blocks with short breaks.', 'Keep a "parking lot" note for stray thoughts so you can drop them without losing them.', 'Close every tab and app you don\'t need for this task.')],
        high: [h('Strong support: spend it well'), p('This is your best window today. The main risk now is spending it on the wrong thing.'),
          ul('Do the hardest or most important task first, before checking messages.', 'Decide in advance when you\'ll stop, so hyperfocus doesn\'t take the whole afternoon.', 'Set a timer to check in: is this still the right task?', 'Batch small chores for later, when your bar is lower.')]
      },
      h('Strategies that work without medication'),
      ul('**Exercise.** A 2023 network meta-analysis of studies in young people found exercise improved executive functions and reduced inattention, with sports that need quick decisions (ball and racket games) ranking highest.', '**Sleep.** Short sleep reliably worsens attention in everyone, and more so in ADHD.', '**Externalize.** Lists, visible timers and written plans take load off attention.', '**Change the task.** Breaking it smaller, adding a deadline, or making it social can all make dull work grab attention more easily.', '**Behavioral treatment.** Parent training for younger children and skills-based therapy for teens and adults have good evidence, alone or with medication.'),
      h('When to bring it up'),
      p('Tell your prescriber if focus fades well before you need it to, if you notice little difference at all, or if you\'re hyperfocusing on the wrong things for hours. Note the time of day: "great until 1 PM, then gone" is far more useful than "it doesn\'t last".')
    ],
    sources: [SRC.FDA_XR, SRC.EXERCISE, SRC.CDC_TX, SRC.NIMH],
    related: ['area-start', 'timing', 'area-time']
  },

  {
    id: 'area-start', area: 'area-start', section: 'Areas of functioning', read: 6,
    title: 'Getting started',
    dek: 'The wall between knowing what to do and actually beginning. Why it\'s so tall in ADHD, how medication lowers it, and how to get over it in your current zone.',
    covers: ['why starting is hard in ADHD', 'how the medication helps', 'strategies for your current zone', 'what else helps with procrastination'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('Task initiation is the step from intention to action. With ADHD, it often feels like there\'s a wall in the way, especially for tasks that are boring, vague or big. It isn\'t laziness: the brain\'s motivation system responds less to rewards that are far away, so "this matters next week" doesn\'t create much push today.'),
      h('How the medication helps'),
      p(MECH + ' Dopamine is closely tied to motivation and reward, so many people find the wall shrinks while the dose is active. Starting tends to feel easiest while levels are still rising, which Bloodstream reflects in this bar.'),
      { k: 'byZone',
        low: [h('Near baseline: make it tiny'), p('Without much medication support, shrink the first step until it\'s almost silly.'),
          ul('Define the first physical action: "open the document", not "write the essay".', 'Set a two-minute timer and promise yourself you can stop when it rings.', 'Start next to someone else, or tell someone what you\'re about to do.', 'Pair it with something pleasant: music, a drink, a nice spot.')],
        mid: [h('Partial support: line things up'), p('Starting is easier than at baseline, so use it to get several things moving.'),
          ul('Write a short list of three tasks, smallest first.', 'Start the next task before you take a break, even for a minute, so it\'s already open when you come back.', 'Use a "when, then" plan: "When I finish lunch, then I open the report."')],
        high: [h('Strong support: tackle the avoided task'), p('This is the best time today for the thing you\'ve been putting off.'),
          ul('Pick the task that\'s been on your list the longest and start it now.', 'Don\'t spend this window on email or easy tasks you could do later.', 'Before the bar drops, leave yourself a note on exactly where to restart.')]
      },
      h('What else helps'),
      ul('**Implementation plans.** Deciding exactly when and where you\'ll start ("At 4 PM at the kitchen table, I\'ll do the first two problems") makes starting more likely than a general intention.', '**Shrinking the task.** Vague tasks are harder to start than specific ones. Rewrite tasks as physical actions.', '**Body doubling.** Working beside another person, even silently, helps many people with ADHD get going.', '**Deadlines and accountability.** Artificial deadlines and check-ins create the urgency that ADHD brains respond to.', '**Rewards now.** Small, immediate rewards work better than distant ones.'),
      h('When to bring it up'),
      p('If you still can\'t get started even at what Bloodstream shows as your peak, or the medication helps you start but you end up starting the wrong things, mention it. Both are useful signals for adjusting treatment.')
    ],
    sources: [SRC.FDA_XR, SRC.CDC_TX, SRC.CHADD, SRC.NIMH],
    related: ['area-focus', 'area-time', 'benefits']
  },

  {
    id: 'area-memory', area: 'area-memory', section: 'Areas of functioning', read: 6,
    title: 'Working memory',
    dek: 'Your mental sticky note: holding a few things in mind while you use them. Why it slips in ADHD, what medication changes, and how to stop relying on it.',
    covers: ['what working memory is', 'how the medication helps', 'strategies for your current zone', 'why brain-training games don\'t help much'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('Working memory is the brain\'s scratch pad: remembering a phone number long enough to dial it, following multi-step instructions, or keeping track of where you were in a task after an interruption. Everyone\'s is small, holding only about four chunks at a time. In ADHD, it tends to be smaller still, and easier to wipe.'),
      { k: 'v', v: { type: 'stats', items: [{ value: '~4', label: 'Chunks of information most adults can hold at once' }, { value: '1', label: 'Interruption it can take to lose them' }] }, cap: 'Based on Cowan\'s review of short-term memory capacity.' },
      h('How the medication helps'),
      p(MECH + ' Norepinephrine and dopamine both tune the brain areas that hold information online, so working memory often improves on stimulants. It won\'t give you a bigger scratch pad, though, so offloading still pays off.'),
      { k: 'byZone',
        low: [h('Near baseline: write everything down'), p('Assume anything not written down will be lost.'),
          ul('Capture tasks, appointments and ideas the moment they come up, in one place.', 'Follow written steps rather than remembering them.', 'Say instructions back out loud, or ask for them in a message.', 'Do one thing at a time and finish it before starting the next.')],
        mid: [h('Partial support: chunk it'), p('You can hold a bit more now, so group information to stretch it further.'),
          ul('Group related items: "three things for the store" rather than a long list.', 'Use a checklist for multi-step tasks and tick off as you go.', 'Before an interruption, jot down where you were.')],
        high: [h('Strong support: plan and organize'), p('A good time for work that needs several pieces held in mind.'),
          ul('Do mental math, planning, studying or complex instructions now.', 'Set up systems your future self will use: lists, calendar entries, labeled folders.', 'Write a short plan for later today, while it\'s easy to think it through.')]
      },
      h('Do brain-training games help?'),
      p('A meta-analysis of working memory training found improvements on the trained tasks themselves, but little evidence that they carry over to everyday skills like reading or attention in class. Building outside systems tends to help more than trying to grow the scratch pad.'),
      h('Strategies that work without medication'),
      ul('One trusted capture place: a notes app, a notebook or Bloodstream\'s log for medication things.', 'Calendar reminders with alerts for anything time-based.', 'A fixed home for keys, wallet and phone.', 'Visual checklists by the door for leaving the house.'),
      h('When to bring it up'),
      p('Mention it if you\'re still regularly losing track of instructions or conversations while your medication is at its strongest, or if forgetting is causing problems at school, work or home.')
    ],
    sources: [SRC.FDA_XR, SRC.COWAN, SRC.WMT, SRC.CDC_TX],
    related: ['area-focus', 'area-time', 'area-start']
  },

  {
    id: 'area-time', area: 'area-time', section: 'Areas of functioning', read: 6,
    title: 'Time awareness',
    dek: '"Time blindness" is one of the most consistent findings in ADHD research. What it is, what medication can and can\'t do, and how to make time visible.',
    covers: ['what time blindness is', 'how the medication helps', 'strategies for your current zone', 'tools that make time visible'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('People with ADHD often experience time as "now" and "not now". Tasks take longer than expected, an hour disappears into something interesting, and future deadlines don\'t feel real until they\'re close. A 2021 meta-analysis of 55 studies found consistent differences in how people with ADHD perceive and estimate time.'),
      h('How the medication helps'),
      p(MECH + ' Many people find their sense of time sharpens on medication, and estimates become more realistic. It\'s one of the subtler benefits, and hyperfocus can still swallow time even at peak, so outside tools stay important.'),
      { k: 'byZone',
        low: [h('Near baseline: let tools keep time'), p('Your internal clock is on its own right now, so hand the job to devices.'),
          ul('Set alarms for every transition: leaving, starting, stopping.', 'Use a visible timer that shows time passing, not just a number.', 'Add 50% to every time estimate.', 'Work backward from when you need to leave, and set an alarm for when to start getting ready.')],
        mid: [h('Partial support: check in regularly'), p('Your sense of time is improving but still drifts.'),
          ul('Set a quiet hourly chime to check: what time is it, and am I on track?', 'Before starting a task, write down how long you think it will take, then compare.', 'Keep a clock in view, ideally an analog one.')],
        high: [h('Strong support: plan the rest of the day'), p('Your time sense is at its best today. Use it to plan ahead.'),
          ul('Block out the rest of today and tomorrow in your calendar.', 'Break deadlines into dated steps.', 'Set a timer to stop hyperfocus from eating your evening plans.')]
      },
      h('Tools that make time visible'),
      ul('**Analog clocks and visual timers.** Seeing time shrink is easier to feel than reading digits.', '**Calendar blocks.** Put tasks, not just events, into your calendar.', '**Alarms with labels.** "Leave for practice" is more useful than a beep.', '**A routine.** Doing things in the same order each day means less time tracking.', '**Several strategies.** CHADD suggests keeping a menu of time strategies, since one that works this month may stop working next month.'),
      h('When to bring it up'),
      p('If lateness or missed deadlines are causing real problems, even on medication, it\'s worth discussing. It may be a timing issue (the dose wears off before the busy part of your day) or a sign that skills-based support would help.')
    ],
    sources: [SRC.FDA_XR, SRC.TIME, SRC.CHADD],
    related: ['area-focus', 'area-start', 'missed']
  },

  {
    id: 'area-impulse', area: 'area-impulse', section: 'Areas of functioning', read: 6,
    title: 'Impulse control',
    dek: 'The pause between wanting to and doing. Why it\'s short in ADHD, how medication lengthens it, and how to add friction when it\'s short.',
    covers: ['what impulse control is', 'how the medication helps', 'strategies for your current zone', 'adding friction'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('Impulsivity in ADHD shows up as interrupting, blurting, impulse buying, quick risky decisions, or trouble waiting. The brain systems that apply the brakes are slower to engage, so the action happens before the second thought arrives.'),
      h('How the medication helps'),
      p(MECH + ' Many people describe the medication as adding a pause button: a moment between the urge and the action. That pause is usually strongest around the peak.'),
      { k: 'byZone',
        low: [h('Near baseline: add friction'), p('Your pause button is short right now, so put obstacles between you and impulsive choices.'),
          ul('Remove saved cards from shopping apps and wait 24 hours before buying anything nonessential.', 'Draft messages and send them later.', 'Count to five before speaking in a heated moment.', 'Avoid big decisions until your bar is higher.')],
        mid: [h('Partial support: use the pause'), p('There\'s a pause now, but it\'s easy to skip. Make it a habit.'),
          ul('Ask "do I want this tomorrow?" before buying or committing.', 'In conversations, jot your point down instead of interrupting.', 'Keep your phone out of reach while working.')],
        high: [h('Strong support: set up guardrails'), p('Your pause button is strongest now. Use it to protect your future self.'),
          ul('Set spending limits and app timers you\'ll keep later.', 'Make the decisions you\'ve been putting off, deliberately.', 'Plan how you\'ll handle the evening, when the pause gets shorter.')]
      },
      h('Strategies that work without medication'),
      ul('**Friction.** The more steps between the urge and the action, the more often the urge passes.', '**If-then rules.** "If I want to buy something over $30, then I wait a day."', '**Hands busy.** A fidget or note-taking cuts down on interrupting.', '**Exercise and sleep.** Both improve inhibitory control, the brain\'s braking system.', '**Skills-based therapy.** Particularly helpful for teens and adults dealing with impulsive spending, driving or relationships.'),
      { k: 'callout', tone: 'warn', t: 'If impulsivity is leading to dangerous situations, such as reckless driving, unsafe sex or substance use, raise it with your prescriber soon.' },
      h('When to bring it up'),
      p('Tell your prescriber about impulsive situations that keep happening, and note when they happen. A pattern of trouble in the evening, after the dose has worn off, is a different problem from trouble all day.')
    ],
    sources: [SRC.FDA_XR, SRC.EXERCISE, SRC.CDC_TX],
    related: ['area-emotion', 'area-social', 'substances']
  },

  {
    id: 'area-emotion', area: 'area-emotion', section: 'Areas of functioning', read: 6,
    title: 'Emotional steadiness',
    dek: 'Big feelings, fast. Emotion regulation is part of ADHD for many people. How medication affects it across the day, and what to do in each zone.',
    covers: ['why emotions run hot in ADHD', 'how the medication affects mood across the day', 'strategies for your current zone', 'when mood changes need a call'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('Emotional dysregulation means feelings arrive fast, hit hard and take a while to settle. It isn\'t in the official diagnostic criteria for ADHD, but a major review found it in roughly 25 to 45% of children and 30 to 70% of adults with ADHD. Frustration, impatience and quick anger are common examples.'),
      h('How the medication affects it'),
      p(MECH + ' For many people this steadies emotions, since the same brakes that slow impulsive actions also slow impulsive feelings. But timing matters: the comedown, when levels fall, is when irritability and low mood are most likely. Bloodstream lowers this bar in the comedown to reflect that.'),
      { k: 'byZone',
        low: [h('Low support or comedown: lower the load'), p('This is the most fragile window for mood. Plan for it rather than fight it.'),
          ul('Check the basics first: when did you last eat and drink water?', 'Name the feeling and the cause: "I\'m irritable because my dose is wearing off."', 'Postpone difficult conversations until you\'re steadier.', 'Take a short walk or some quiet time alone.', 'Let people around you know this is a tough window.')],
        mid: [h('Partial support: catch it early'), p('You have some buffer now. Use it to notice feelings before they escalate.'),
          ul('Pause and breathe out slowly when you feel heat rising.', 'Step away briefly rather than reacting in the moment.', 'Keep snacks nearby. Hunger shortens fuses.')],
        high: [h('Strong support: check in with yourself'), p('Emotions are usually steadiest now. A good moment to notice how you feel overall.'),
          ul('Notice whether you feel like yourself, or flat and muted. Both are worth logging.', 'Have the important conversations now, while you\'re steadier.', 'Plan something calming for the comedown later.')]
      },
      h('Strategies that work without medication'),
      ul('**Sleep and food.** Tired and hungry make every feeling bigger.', '**Name it to tame it.** Putting a feeling into words can take some of the heat out of it.', '**A pause routine.** Agree with family on a signal for "I need ten minutes".', '**Skills-based therapy.** Approaches that teach emotion regulation skills help many teens and adults with ADHD.'),
      { k: 'callout', tone: 'urgent', t: 'If you feel hopeless, or have thoughts of hurting yourself, call or text 988. New aggression, or sadness most days for two weeks or more, deserves a call to your prescriber soon.' },
      h('When to bring it up'),
      p('Tell your prescriber about mood changes, and when in the day they happen. Feeling flat at peak and snappy at the comedown are both common, and both are things a prescriber can often help with.')
    ],
    sources: [SRC.SHAW, SRC.FDA_XR, SRC.LIFELINE, SRC.CDC_TX],
    related: ['mood', 'rebound', 'area-impulse']
  },

  {
    id: 'area-calm', area: 'area-calm', section: 'Areas of functioning', read: 5,
    title: 'Calm body',
    dek: 'Restlessness, fidgeting and the urge to move. How medication quiets it, why some people feel jittery instead, and how to give the energy somewhere to go.',
    covers: ['what hyperactivity looks like at different ages', 'how the medication helps', 'strategies for your current zone'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('In children, hyperactivity often looks like running, climbing and not staying seated. In teens and adults, it usually turns inward: fidgeting, tapping, restlessness, an inner motor that won\'t switch off, or difficulty relaxing.'),
      h('How the medication helps'),
      p(MECH + ' For most people with ADHD, that steadies the body rather than speeding it up. Some people feel jittery around the peak instead, especially with caffeine or a dose that\'s more than they need.'),
      { k: 'byZone',
        low: [h('Near baseline: give it an outlet'), p('Restlessness is back near your usual. Work with it.'),
          ul('Take movement breaks every 20 to 30 minutes.', 'Use a fidget, a standing desk or a wobble cushion.', 'Walk while you take phone calls or think through problems.', 'Schedule exercise for this part of the day if you can.')],
        mid: [h('Partial support: mix movement in'), p('Sitting still is getting easier, but movement still helps.'),
          ul('Stand or stretch between tasks.', 'Keep something quiet to fidget with during meetings or class.')],
        high: [h('Strong support: watch for jitters'), p('Restlessness is usually lowest now. If you feel shaky or wired instead, that\'s worth noting.'),
          ul('Skip extra caffeine during this window.', 'If you feel jittery, breathe out slowly, eat something and move gently.', 'Log jitters with the time, so your prescriber can see whether they line up with the peak.')]
      },
      h('Strategies that work without medication'),
      ul('**Exercise.** Regular aerobic exercise reduced hyperactivity and impulsivity in a 2023 network meta-analysis of studies in young people.', '**Movement-friendly setups.** Standing desks, fidgets and permission to move help children and adults stay on task.', '**Outdoor time.** Many people find time outside calms restlessness.'),
      h('When to bring it up'),
      p('Mention restlessness that stays high even at your peak, or jitters, shakiness or a racing heart that come with the dose.')
    ],
    sources: [SRC.FDA_XR, SRC.EXERCISE, SRC.NIMH],
    related: ['anxiety', 'area-body', 'heart']
  },

  {
    id: 'area-social', area: 'area-social', section: 'Areas of functioning', read: 5,
    title: 'Conversation',
    dek: 'Listening, taking turns and keeping track of what someone said. How ADHD and medication shape conversation, and how to make the most of each zone.',
    covers: ['how ADHD affects conversation', 'how the medication helps', 'strategies for your current zone', 'feeling quieter on medication'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('ADHD can make conversation harder in a few ways: drifting off while someone talks, interrupting, losing the thread, or blurting something out before thinking it through. None of it means you don\'t care. It\'s attention and impulse control showing up in real time.'),
      h('How the medication helps'),
      p(MECH + ' Many people find it easier to listen and take turns on medication. Some feel quieter or more serious than usual, which can be a sign that the dose is more than they need.'),
      { k: 'byZone',
        low: [h('Near baseline: support the thread'), p('Attention in conversation is near your usual. A few tricks help.'),
          ul('Keep important conversations short, or schedule them for later.', 'Take notes in meetings, even brief ones.', 'Repeat back what you heard: "So you\'re saying..."', 'It\'s okay to say "Sorry, I lost that. Could you say it again?"')],
        mid: [h('Partial support: stay with the speaker'), p('Listening is easier, but your mind may still wander.'),
          ul('Jot down your point instead of interrupting, and bring it up when there\'s a pause.', 'Ask one follow-up question before changing the subject.')],
        high: [h('Strong support: good time to connect'), p('A good window for meetings, calls and important conversations.'),
          ul('Schedule the important conversations now if you can.', 'Notice whether you feel like yourself. Feeling unusually flat or quiet is worth logging.')]
      },
      h('If you feel quieter on medication'),
      p('Some people feel less talkative, less funny or more reserved on stimulants. If it bothers you or the people close to you, that\'s useful feedback for your prescriber, and often a sign the dose or timing could be fine-tuned.'),
      h('Strategies that work without medication'),
      ul('Tell close friends or family about ADHD, if you\'re comfortable, so interruptions are understood.', 'Use messages for detailed plans, so you have them in writing.', 'Social skills groups help some children and teens.'),
      h('When to bring it up'),
      p('Mention conversation struggles that are affecting relationships, school or work, and whether they change across the day.')
    ],
    sources: [SRC.FDA_XR, SRC.CDC_TX, SRC.CHADD],
    related: ['area-impulse', 'mood', 'area-emotion']
  },

  {
    id: 'area-energy', area: 'area-energy', section: 'Areas of functioning', read: 5,
    title: 'Energy',
    dek: 'Alertness rises with the dose and can drop hard as it fades. How to ride the curve without crashing.',
    covers: ['why energy follows the dose', 'how to handle the afternoon crash', 'strategies for your current zone'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('Stimulants increase alertness, which many people experience as having more energy to get through the day. As levels fall, that borrowed alertness fades, and tiredness from a busy day, a short night or skipped meals can land all at once.'),
      h('How the medication affects it'),
      p(MECH + ' The same signaling that sharpens attention also increases wakefulness. That\'s helpful during the day and less helpful at bedtime, which is why energy and sleep are closely linked on stimulants.'),
      { k: 'byZone',
        low: [h('Low or fading: refuel'), p('This is often the crash zone. Treat it as a cue to refuel, not push through.'),
          ul('Eat something with protein, and drink water.', 'Take a short walk outside rather than reaching for caffeine.', 'Switch to lighter tasks.', 'If it\'s evening, let yourself wind down. Your body is heading toward sleep.')],
        mid: [h('Partial support: pace yourself'), p('Energy is steady but not at its highest.'),
          ul('Keep a snack nearby for when energy dips.', 'Take short breaks before you feel drained.')],
        high: [h('Strong support: avoid stacking'), p('Alertness is high. More stimulation now can tip it into feeling wired.'),
          ul('Skip extra caffeine and energy drinks.', 'Use this window for active or demanding tasks.', 'Drink water, especially if you\'re exercising.')]
      },
      h('Strategies that work without medication'),
      ul('**Sleep.** The most reliable energy source there is.', '**Regular meals.** Low appetite on medication can mean running on empty by mid-afternoon.', '**Movement.** Short bursts of activity raise alertness naturally.', '**Daylight.** Morning light helps set your body clock.'),
      h('When to bring it up'),
      p('Mention a crash that is intense or interferes with your evening, or feeling exhausted most days. Fatigue that persists can have many causes, and your prescriber may want to look beyond the medication.')
    ],
    sources: [SRC.FDA_XR, SRC.NHLBI_SLEEP, SRC.KELTY],
    related: ['rebound', 'sleep', 'area-appetite']
  },

  {
    id: 'area-appetite', area: 'area-appetite', section: 'Areas of functioning', read: 5,
    title: 'Appetite suppression',
    dek: 'How much the medication is muting hunger right now, and what to eat in each zone so the day doesn\'t end on empty.',
    covers: ['why appetite drops', 'what to eat in each zone', 'when appetite changes need a call'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('Reduced appetite is one of the most common side effects of Adderall. Hunger cues get quieter while levels are high, and usually come back, sometimes strongly, as the dose wears off. This bar runs the other way from the others: green means appetite is close to normal.'),
      h('How the medication affects it'),
      p('The same messengers that improve focus also act on the brain\'s appetite centers and the body\'s stress response, which turns hunger down. The effect tends to follow blood levels closely, which is why Bloodstream ties this bar to your blood level rather than felt effect.'),
      { k: 'byZone',
        low: [h('Appetite is mostly normal: eat a real meal'), p('Hunger is close to normal right now. This is the best time to eat properly.'),
          ul('Have a full, balanced meal now if it\'s mealtime.', 'In the morning, eat breakfast before your dose kicks in.', 'In the evening, plan a second supper if lunch was light.')],
        mid: [h('Appetite is reduced: go small and dense'), p('You may not feel hungry, but your body still needs fuel.'),
          ul('Choose small, calorie-dense foods: nuts, cheese, yogurt, a granola bar.', 'Try a smoothie or shake if chewing feels like effort.', 'Set a reminder, since hunger cues are quiet.')],
        high: [h('Appetite is very low: drink some of it'), p('Hunger is strongly suppressed. Don\'t force big meals. Aim for small, regular amounts.'),
          ul('Sip a shake, milk or smoothie.', 'Keep easy snacks within reach.', 'Drink water: thirst can be muted too.', 'Plan a proper meal for when this bar turns green.')]
      },
      h('Habits that help'),
      ul('Breakfast before the dose.', 'Calorie-dense snacks during the day.', 'A planned evening meal or second supper.', 'Favorite foods available, to make eating easier.'),
      { k: 'callout', tone: 'warn', t: 'Call your prescriber if you or your child keeps losing weight without trying, is regularly skipping meals, or feels dizzy or weak.' }
    ],
    sources: [SRC.FDA_XR, SRC.CHC_APPETITE, SRC.KELTY],
    related: ['appetite', 'growth', 'area-energy']
  },

  {
    id: 'area-body', area: 'area-body', section: 'Areas of functioning', read: 5,
    title: 'Physical stimulation',
    dek: 'Heart rate, blood pressure and other body effects follow your blood level. What\'s normal in each zone, and what isn\'t.',
    covers: ['what physical stimulation includes', 'what to expect in each zone', 'which symptoms need care'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('Beyond the brain, amphetamine acts on the nervous system that controls heart rate, blood pressure, sweating and the size of your pupils. This bar estimates how much of that is happening, based on your blood level. Like appetite, it runs the other way: green means settled.'),
      h('What\'s normal'),
      p('On average, the label reports blood pressure rising by 2 to 4 mm Hg and heart rate by 3 to 6 beats per minute. Dry mouth, a slightly faster pulse and feeling warmer are common, especially around the peak.'),
      { k: 'byZone',
        low: [h('Settled'), p('Physical effects are minimal right now.'),
          ul('A good time for a baseline blood pressure reading, if you take them.', 'Hydrate and eat, especially if you skipped meals earlier.')],
        mid: [h('Noticeable: keep an eye on it'), p('Some physical effects are likely right now.'),
          ul('Drink water regularly.', 'Go easy on caffeine and nicotine.', 'Take care in the heat and during hard exercise.')],
        high: [h('Elevated: peak body effects'), p('Physical effects are near their highest. Usually that means a faster pulse or dry mouth.'),
          ul('If you track blood pressure, this is the time for your peak reading.', 'Skip extra caffeine and decongestants.', 'Notice how you feel: racing heart, chest discomfort or dizziness are worth logging.')]
      },
      { k: 'callout', tone: 'urgent', t: 'Chest pain, fainting, or new shortness of breath at any point: call 911.' },
      h('When to bring it up'),
      p('Mention a racing or pounding heart that keeps coming back, home blood pressure readings that are higher than before, or dizziness when standing.')
    ],
    sources: [SRC.FDA_XR, SRC.AHA_BP, SRC.FDA_CAFFEINE],
    related: ['heart', 'substances', 'area-calm']
  },

  {
    id: 'area-sleep', area: 'area-sleep', section: 'Areas of functioning', read: 5,
    title: 'Sleep readiness',
    dek: 'How ready your body is to fall asleep, given what\'s still active. What to do in each zone, from "blocked" to "ready".',
    covers: ['what sleep readiness measures', 'what to do in each zone', 'how to protect sleep'],
    blocks: [
      { k: 'now' },
      h('What it is'),
      p('This bar is the flip side of Bloodstream\'s sleep interference estimate: it blends how much effect you\'re likely still feeling with how much medicine is still in your blood. When it\'s green, little stimulant activity is expected and falling asleep should feel close to normal.'),
      h('Why it matters'),
      p('Sleep is when the brain recovers. Short or broken sleep makes attention, mood and impulse control worse the next day, undoing much of what the medication helps with.'),
      { k: 'byZone',
        low: [h('Not ready yet: wind down without pressure'), p('Falling asleep now would likely be hard. Lying in bed frustrated tends to make it worse.'),
          ul('Do something calm in dim light: reading, a shower, quiet music.', 'Avoid bright screens and stimulating content.', 'If this is your usual bedtime, log it. It\'s exactly the kind of pattern your prescriber needs to see.')],
        mid: [h('Getting there: start your routine'), p('Sleep is becoming possible. Start your wind-down so you\'re ready when it is.'),
          ul('Dim the lights and put the phone on a charger outside reach.', 'Do your bedtime routine in the same order as always.', 'Keep the bedroom cool, dark and quiet.')],
        high: [h('Ready: go to bed'), p('Little stimulant activity is expected now. Your usual sleep habits are what matter most.'),
          ul('Head to bed when you feel sleepy.', 'Keep your wake-up time steady tomorrow, even if you\'re up a bit late.')]
      },
      h('Protecting sleep'),
      ul('A consistent wake time every day.', 'Daylight in the morning and dim light at night.', 'No caffeine after early afternoon.', 'Talk to your prescriber about timing if readiness regularly lags past your bedtime.'),
      { k: 'callout', tone: 'info', t: 'Set your planned bedtime in the Sleep card on your dashboard, and Bloodstream will estimate interference for that time each day.' }
    ],
    sources: [SRC.NHLBI_SLEEP, SRC.FDA_XR, SRC.KELTY],
    related: ['sleep', 'area-energy', 'timing']
  }
];
