import { describe, expect, it } from 'vitest';
import { ARTICLES, articleById, headingsOf, searchArticles } from '../src/content/articles';
import { CATEGORIES, guidanceFor, SUGGESTIONS, suggestionsFor } from '../src/content/suggestions';
import { AREA_IDS, EFFECT_GROUPS } from '../src/model/copy';
import type { LogType } from '../src/model/types';

describe('article library', () => {
  it('has unique ids, sources, covers and real related links', () => {
    const ids = new Set<string>();
    for (const a of ARTICLES) {
      expect(ids.has(a.id), a.id).toBe(false);
      ids.add(a.id);
      expect(a.sources.length, a.id).toBeGreaterThan(0);
      expect(a.covers.length, a.id).toBeGreaterThan(0);
      expect(a.blocks.length, a.id).toBeGreaterThan(3);
      for (const r of a.related ?? []) expect(articleById(r), `${a.id} -> ${r}`).toBeTruthy();
      for (const s of a.sources) expect(s.u).toMatch(/^https:\/\//);
    }
  });

  it('every suggestion links to an existing article', () => {
    for (const s of SUGGESTIONS) expect(articleById(s.article), s.id).toBeTruthy();
  });

  it('every effectivity area has an adaptive article', () => {
    for (const g of EFFECT_GROUPS) for (const it of g.items) {
      const a = articleById(AREA_IDS[it.name]);
      expect(a, it.name).toBeTruthy();
      expect(a!.area).toBe(a!.id);
      expect(a!.blocks.some(b => b.k === 'now')).toBe(true);
      expect(a!.blocks.some(b => b.k === 'byZone')).toBe(true);
    }
  });

  it('suggestion ids are unique and categories exist', () => {
    const ids = SUGGESTIONS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const cats = new Set(CATEGORIES.map(c => c.id));
    for (const s of SUGGESTIONS) expect(cats.has(s.cat), s.id).toBe(true);
    expect(SUGGESTIONS.length).toBeGreaterThan(100);
  });

  it('serious suggestions say what to watch for and what to do', () => {
    for (const s of SUGGESTIONS.filter(x => x.urgency === 'stop' || x.urgency === 'emergency')) {
      expect(s.watch, s.id).toBeTruthy();
      expect(s.action, s.id).toBeTruthy();
      const g = guidanceFor(s, s.types[0], articleById(s.article)!.covers);
      expect(g.tone).toBe(s.urgency);
      expect(g.body).toContain(s.watch!);
    }
  });

  it('stop guidance recommends stopping until the prescriber is reached', () => {
    const s = SUGGESTIONS.find(x => x.id === 'mood-voices')!;
    expect(guidanceFor(s, 'effect', []).body).toMatch(/recommends you stop taking this medication until you've spoken with your prescriber/);
  });

  it('every type has suggestions in most categories', () => {
    for (const t of ['effect', 'question'] as LogType[]) {
      const withAny = CATEGORIES.filter(c => suggestionsFor(t, c.id).length > 0).length;
      expect(withAny, t).toBeGreaterThan(8);
    }
  });

  it('search finds titles and section headings', () => {
    expect(searchArticles('dry mouth')[0].article.id).toBe('mouth');
    expect(searchArticles('take-back').length + searchArticles('leftovers').length).toBeGreaterThan(0);
    const hit = searchArticles('forgot').find(h => h.article.id === 'missed');
    expect(hit?.heading).toBe('If you forgot');
    expect(headingsOf(articleById('area-focus')!)).toContain('Near baseline: borrow structure');
  });
});
