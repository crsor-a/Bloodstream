/**
 * In-app reminders. Web apps on iPhone (iOS 16.4+, installed to the Home Screen) may show
 * notifications, but only while Bloodstream is running: there is no way for a website to
 * schedule an alert while it's closed without a push server. So reminders here fire while the
 * app is open or recently used, and the Calendar export covers the rest.
 */
export type NotifyState = 'unsupported' | 'needs-install' | 'default' | 'granted' | 'denied';

export const isStandalone = () =>
  (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function notifyState(): NotifyState {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return isIOS() && !isStandalone() ? 'needs-install' : 'unsupported';
  if (isIOS() && !isStandalone()) return 'needs-install';
  return Notification.permission as NotifyState;
}

export async function requestNotify(): Promise<NotifyState> {
  const s = notifyState();
  if (s === 'unsupported' || s === 'needs-install') return s;
  try { return (await Notification.requestPermission()) as NotifyState; } catch { return notifyState(); }
}

export interface Reminder { at: number; title: string; body: string; tag: string; stillNeeded?: () => boolean }

let timers: number[] = [];
/** Replaces all pending reminders. Only schedules what falls within the next 24 h. */
export function armReminders(list: Reminder[]) {
  timers.forEach(t => clearTimeout(t));
  timers = [];
  if (notifyState() !== 'granted') return;
  const now = Date.now();
  for (const r of list) {
    const wait = r.at - now;
    if (wait < -60_000 || wait > 24 * 3_600_000) continue;
    timers.push(window.setTimeout(async () => {
      if (r.stillNeeded && !r.stillNeeded()) return;
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(r.title, { body: r.body, tag: r.tag, icon: 'icons/drop-192.png', badge: 'icons/drop-64.png' });
      } catch { try { new Notification(r.title, { body: r.body, tag: r.tag }); } catch { /* not allowed */ } }
    }, Math.max(0, wait)));
  }
}
