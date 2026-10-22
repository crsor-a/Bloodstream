import type { Article, Block, Section } from '../types';
import { SECTIONS } from '../types';
import { SAFETY } from './safety';
import { EFFECTS } from './effects';
import { EVERYDAY } from './everyday';
import { AREAS } from './areas';

export const ARTICLES: Article[] = [...SAFETY, ...EFFECTS, ...EVERYDAY, ...AREAS];
const BY_ID = new Map(ARTICLES.map(a => [a.id, a]));
export const articleById = (id: string | null | undefined) => (id ? BY_ID.get(id) : undefined);

export function articlesBySection(): { section: Section; items: Article[] }[] {
  return SECTIONS.map(section => ({ section, items: ARTICLES.filter(a => a.section === section) })).filter(g => g.items.length);
}

/** All section headings in an article, including those inside adaptive blocks. */
export function headingsOf(a: Article): string[] {
  const out: string[] = [];
  const walk = (bs: Block[]) => bs.forEach(b => {
    if (b.k === 'h') out.push(b.t);
    else if (b.k === 'byZone') { walk(b.low); walk(b.mid); walk(b.high); }
  });
  walk(a.blocks);
  return [...new Set(out)];
}

const norm = (s: string) => s.toLowerCase().replace(/\*\*/g, '').replace(/[^a-z0-9 ]+/g, ' ');

export interface SearchHit { article: Article; heading: string | null }
/** Search titles, summaries and section headers. Every word must match somewhere. */
export function searchArticles(q: string): SearchHit[] {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return ARTICLES.map(article => ({ article, heading: null }));
  const hits: (SearchHit & { score: number })[] = [];
  for (const a of ARTICLES) {
    const title = norm(a.title), dek = norm(a.dek), heads = headingsOf(a);
    const hay = [title, dek, a.section.toLowerCase(), ...heads.map(norm), ...a.covers.map(norm)].join(' ');
    if (!words.every(w => hay.includes(w))) continue;
    const heading = heads.find(hd => words.some(w => norm(hd).includes(w))) ?? null;
    const score = words.reduce((s, w) => s + (title.includes(w) ? 3 : 0) + (heading && norm(heading).includes(w) ? 2 : 0) + (dek.includes(w) ? 1 : 0), 0);
    hits.push({ article: a, heading: title.includes(words[0]) ? null : heading, score });
  }
  return hits.sort((x, y) => y.score - x.score);
}
