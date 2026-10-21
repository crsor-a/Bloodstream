import { render } from 'preact';
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
