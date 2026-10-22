import { effect } from '@preact/signals';
import { fmtMg, pillSVG } from '../lib/pill';
import { fmtTime, MIN } from '../lib/time';
import { armReminders, type Reminder } from '../lib/notify';
import { slotsOnDay, slotTaken } from '../model/schedule';
import { addPage, addSlot, attention, doses, incognito, meds, schedules, settings, sheetOpen, showToast, skipSlot, sweepToken, takeMed } from '../state';

/** Check-ins for scheduled doses: shown on the dashboard, never in incognito. */
export function DueCards() {
  if (incognito.value) return null;
  const items = attention.value;
  if (!items.length) return null;
  return (
    <div class="due-stack">
      {items.map(({ slot, state }) => {
        const { med } = slot;
        const take = (at: number) => { takeMed(med, at, slot.schedule.id); sweepToken.value++; showToast(`Logged ${med.name} at ${fmtTime(at)}`); };
        const title = state === 'upcoming' ? `${med.name} is due at ${fmtTime(slot.at)}`
          : state === 'due' ? `Time for ${med.name}`
          : `Did you take your ${fmtTime(slot.at)} ${med.name}?`;
        const sub = state === 'missed' ? `Scheduled ${fmtTime(slot.at)} · ${med.kind} ${fmtMg(med.mg)} mg. Log it if you took it, or skip today.`
          : `${med.kind} · ${fmtMg(med.mg)} mg · scheduled ${fmtTime(slot.at)}`;
        return (
          <div class={'card due-card ' + state} key={slot.key} role="status">
            <div class="due-top">
              <div class="mini-pill" dangerouslySetInnerHTML={{ __html: pillSVG(med, { glow: false }) }} />
              <div class="dose-info"><b>{title}</b><span class="sub">{sub}</span></div>
            </div>
            <div class="due-actions">
              {state === 'missed'
                ? <button type="button" class="pill-btn solid" onClick={() => take(slot.at)}>Yes, at {fmtTime(slot.at)}</button>
                : <button type="button" class="pill-btn solid" onClick={() => take(Date.now())}>Take now</button>}
              <button type="button" class="pill-btn" onClick={() => { addSlot.value = slot; addPage.value = 'log'; sheetOpen.value = true; }}>Other time</button>
              <button type="button" class="pill-btn ghost" onClick={() => { skipSlot(slot); showToast('Skipped for today'); }}>Skip today</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Keeps notification timers in sync with schedules (while the app is running). */
export function startReminderSync() {
  return effect(() => {
    const r = settings.value.reminders;
    const sch = schedules.value, ms = meds.value;
    void doses.value; void incognito.value;
    if (!r.enabled) { armReminders([]); return; }
    const list: Reminder[] = [];
    const now = Date.now();
    for (let i = 0; i < 2; i++) {
      const day = new Date(now); day.setDate(day.getDate() + i);
      for (const slot of slotsOnDay(day.getTime(), sch, ms)) {
        if (!slot.schedule.reminder) continue;
        const still = () => !slotTaken(slot, doses.value) && !settings.value.skips[slot.key];
        const discreet = r.discreet || incognito.value;
        list.push({
          at: slot.at - r.lead * MIN, tag: slot.key + ':pre', stillNeeded: still,
          title: discreet ? 'Reminder' : r.lead ? `${slot.med.name} in ${r.lead} minutes` : `Time for ${slot.med.name}`,
          body: discreet ? 'Tap to open.' : `Scheduled for ${fmtTime(slot.at)}. Log it in Bloodstream once you've taken it.`
        });
        list.push({
          at: slot.at + 45 * MIN, tag: slot.key + ':late', stillNeeded: still,
          title: discreet ? 'Check-in' : `Did you take ${slot.med.name}?`,
          body: discreet ? 'Tap to open.' : `It was scheduled for ${fmtTime(slot.at)} and hasn't been logged yet.`
        });
      }
    }
    armReminders(list);
  });
}
