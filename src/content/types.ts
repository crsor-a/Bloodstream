/** Article format. Inline text supports **bold** and {tokens} that adaptive articles fill in. */
export type Tone = 'info' | 'warn' | 'urgent';

export type Visual =
  | { type: 'bars'; title: string; rows: { label: string; a: number; b?: number }[]; legend?: [string, string]; unit?: string }
  | { type: 'curve'; kind: 'IR' | 'XR'; title?: string; show?: 'level' | 'effect' | 'both'; hours?: number; marks?: { h: number; label: string }[]; band?: { from: number; to: number; label: string }; threshold?: { y: number; label: string } }
  | { type: 'ladder'; steps: { level: 'emergency' | 'stop' | 'soon' | 'mention'; title: string; t: string }[] }
  | { type: 'day'; title?: string; from: number; to: number; items: { h: number; label: string; tone?: 'dose' | 'meal' | 'note' | 'sleep' | 'warn' }[]; band?: { from: number; to: number; label: string } }
  | { type: 'stats'; items: { value: string; label: string }[] }
  | { type: 'check'; title: string; items: string[] }
  | { type: 'compare'; a: { title: string; items: string[] }; b: { title: string; items: string[] } }
  | { type: 'cycle'; title?: string; steps: string[] }
  | { type: 'scale'; title: string; unit?: string; min: number; max: number; segs: { label: string; to: number; tone: 'ok' | 'mid' | 'warn' | 'bad' }[]; marker?: { at: number; label: string } }
  | { type: 'zones'; title?: string };

export type Block =
  | { k: 'p'; t: string }
  | { k: 'h'; t: string }
  | { k: 'ul'; items: string[] }
  | { k: 'ol'; items: string[] }
  | { k: 'callout'; tone: Tone; title?: string; t: string }
  | { k: 'v'; v: Visual; cap?: string }
  /** Adaptive: "where you are right now" panel for an area of functioning. */
  | { k: 'now' }
  /** Adaptive: shows one of three block lists depending on the current zone. */
  | { k: 'byZone'; low: Block[]; mid: Block[]; high: Block[] };

export interface Source { t: string; u: string }

export type Section = 'Safety' | 'Side effects' | 'Everyday' | 'Appointments' | 'Areas of functioning';

export interface Article {
  id: string;
  title: string;
  dek: string;
  section: Section;
  read: number;
  /** Short phrases used in log guidance: "covering … and …". */
  covers: string[];
  blocks: Block[];
  sources: Source[];
  related?: string[];
  /** Area-of-functioning articles adapt to the matching effectivity bar. */
  area?: string;
}
