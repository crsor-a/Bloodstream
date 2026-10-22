/**
 * Calendar (.ics) export for schedules. iPhone web apps can't wake themselves up to send
 * reminders, but the Calendar app can: each schedule becomes a weekly repeating event with an alert.
 */
import type { Med, Schedule } from '../model/types';
import { fmtMg } from './pill';

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const pad = (n: number) => String(n).padStart(2, '0');
const local = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const utc = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** First occurrence of the schedule at or after `from`. */
export function firstOccurrence(s: Schedule, from: number): Date {
  const [h, m] = s.time.split(':').map(Number);
  for (let i = 0; i < 8; i++) {
    const d = new Date(from); d.setDate(d.getDate() + i); d.setHours(h, m, 0, 0);
    if (s.days.includes(d.getDay()) && d.getTime() >= from - 60_000) return d;
  }
  const d = new Date(from); d.setHours(h, m, 0, 0); return d;
}

export function buildICS(schedules: Schedule[], meds: Med[], opts: { lead: number; discreet: boolean }, now = Date.now()): string {
  const byId = new Map(meds.map(m => [m.id, m]));
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bloodstream//Schedules//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const s of schedules) {
    const med = byId.get(s.medId);
    if (!med || !s.reminder) continue;
    const start = firstOccurrence(s, now);
    const end = new Date(start.getTime() + 5 * 60_000);
    const title = opts.discreet ? 'Reminder' : `Take ${med.name} (${med.kind} ${fmtMg(med.mg)} mg)`;
    const body = opts.discreet ? 'Open Bloodstream.' : `Scheduled dose: ${med.name}, ${med.kind} ${fmtMg(med.mg)} mg. Log it in Bloodstream once taken.`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${s.id}@bloodstream`,
      `DTSTAMP:${utc(new Date(now))}`,
      `DTSTART:${local(start)}`,
      `DTEND:${local(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${s.days.map(d => BYDAY[d]).join(',')}`,
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc(body)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, `TRIGGER:${opts.lead > 0 ? `-PT${opts.lead}M` : 'PT0M'}`, 'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
