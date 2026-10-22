import type { Dose } from '../model/types';
import { meds } from '../state';
import { fmtMg, shapeName } from './pill';

/** "Morning XR" for doses of a saved medication, otherwise "XR capsule". */
export function doseName(d: Dose): string {
  const m = d.medId ? meds.value.find(x => x.id === d.medId) : undefined;
  return m ? m.name : `${d.kind} ${shapeName(d.shape)}`;
}
/** Title for a dose row: the saved medication's name with its strength, or "XR · 20 mg". */
export function doseTitle(d: Dose): string {
  const m = d.medId ? meds.value.find(x => x.id === d.medId) : undefined;
  return m ? `${m.name} · ${fmtMg(d.mg)} mg` : `${d.kind} · ${fmtMg(d.mg)} mg`;
}
