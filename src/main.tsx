import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import './styles/app.css';
import { boot, view } from './state';
import { Onboarding } from './views/Onboarding';
import { Dashboard } from './views/Dashboard';
import { Toast, useEscape } from './components/controls';

function App() {
  useEscape();
  return (
    <div class="wrap">
      {view.value === 'onboard' && <Onboarding />}
      {view.value === 'dash' && <Dashboard />}
      <Toast />
    </div>
  );
}

render(<App />, document.getElementById('app')!);
boot();

// Offline support + updates. With registerType "autoUpdate" the page reloads into a new
// version as soon as it is installed. Saved data lives in IndexedDB and is untouched.
// Installed Home Screen apps often resume without navigating, so also check on resume.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => { if (navigator.onLine) reg.update().catch(() => {}); };
    setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  }
});
