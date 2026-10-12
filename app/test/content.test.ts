import { describe, expect, test } from '@jest/globals';
import { allPages, artOf, challengeOf, codeOf, COUNTRIES, pageOfChallenge, pagesOf, placeOf } from '../src/content';
import { BESTIARY, STARTLE } from '../src/content/bestiary';
import { encodeChallenge, parseChallenge } from '../src/core/challenge';
import { dailyPuzzle } from '../src/core/daily';
import { isMainObject, type Chapter, type Page } from '../src/core/model';
import { cluesOf } from '../src/core/mystery';
import { localDay } from '../src/core/random';
import { SPRITE_ART } from '../src/generated/spriteArt';

/**
 * Every page as the app loads it (content/index.ts already refuses duplicate page ids and
 * missing paintings): coordinates on the spread, behaviours, drawings, day/night pairs.
 */

const inSpread = ([x, y]: [number, number]) => x >= 0 && x <= 1 && y >= 0 && y <= 1;

test('there is a sketchbook to open', () => {
  expect(COUNTRIES.length).toBeGreaterThan(0);
  for (const country of COUNTRIES) expect(pagesOf(country).length).toBeGreaterThan(0);
});

test('every page can be found again by its id ("Chơi tiếp" on the home screen)', () => {
  for (const country of COUNTRIES) {
    for (const ref of pagesOf(country)) {
      expect(placeOf(ref.day.id)).toEqual({ ref, night: false });
      if (ref.night) expect(placeOf(ref.night.id)).toEqual({ ref, night: true });
    }
  }
  expect(placeOf('no-such-page')).toBeNull();
});

test('page ids are unique across countries', () => {
  const ids = allPages().map((p) => p.id);
  expect(new Set(ids).size).toBe(ids.length);
});

describe.each(allPages().map((page): [string, Page] => [page.id, page]))('%s', (_id, page) => {
  test('has a painting, a time limit and a case to solve', () => {
    expect(artOf(page)).toBeTruthy();
    expect(page.title).toBeTruthy();
    expect(page.timeLimit).toBeGreaterThan(0);
    expect(page.objects.filter(isMainObject).length).toBeGreaterThan(0);
    expect(page.objects.filter((o) => o.isSecret).length).toBeLessThanOrEqual(1);
  });

  test('object ids are unique on the page', () => {
    const ids = page.objects.map((o) => o.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  test.each(page.objects.map((o): [string, (typeof page.objects)[number]] => [o.id, o]))('%s is on the spread and drawn', (_objectId, o) => {
    expect(inSpread([o.x, o.y])).toBe(true);
    expect(o.radius).toBeGreaterThan(0);
    expect(o.radius).toBeLessThan(0.2);
    expect(o.score).toBeGreaterThanOrEqual(0);
    if (o.spriteType && o.spriteType !== 'seal') {
      expect(SPRITE_ART[o.spriteType]).toBeDefined();
      expect(BESTIARY[o.spriteType]).toBeDefined();
    }
    if (o.roam) {
      expect(o.roam.path.length).toBeGreaterThanOrEqual(2);
      expect(o.roam.path.every(inSpread)).toBe(true);
      expect(o.roam.period).toBeGreaterThan(0);
    }
    if (o.shy) expect(o.shy.period).toBeGreaterThan(0);
    if (o.occluder) {
      expect(o.occluder.length).toBeGreaterThanOrEqual(3);
      expect(o.occluder.every(inSpread)).toBe(true);
    }
    if (o.waterline !== undefined) {
      expect(o.waterline).toBeGreaterThan(0);
      expect(o.waterline).toBeLessThan(1);
    }
  });
});

describe('night pages', () => {
  const pairs = COUNTRIES.flatMap((country) => pagesOf(country));

  test('only night variants are dark', () => {
    for (const ref of pairs) {
      expect(ref.day.isNight).toBeFalsy();
      if (ref.night) expect(ref.night.isNight).toBe(true);
    }
  });

  test('a night page reuses the painting of its day page', () => {
    for (const ref of pairs) if (ref.night) expect(ref.night.art).toBe(ref.day.art);
  });
});

// The paper of the template, where everything is hidden (normalized: x 88–1672, y 270–969 of 1760 × 1240)
const onPaper = (x: number, y: number) => x >= 88 / 1760 && x <= 1672 / 1760 && y >= 270 / 1240 && y <= 969 / 1240;

describe('challenge codes and daily pages over the real books', () => {
  test('every country has its own two capital letters', () => {
    const codes = COUNTRIES.map(codeOf);
    for (const code of codes) expect(code).toMatch(/^[A-Z]{2}$/);
    expect(new Set(codes).size).toBe(codes.length);
  });

  test('the code of a hunt on any page leads back to that page', () => {
    for (const page of allPages()) {
      const challenge = parseChallenge(encodeChallenge(challengeOf(page, 12_345, 99)));
      expect(challenge).not.toBeNull();
      const at = pageOfChallenge(challenge!);
      expect(at && (at.night ? at.ref.night : at.ref.day)).toBe(page);
    }
  });

  test('there is a daily page every day', () => {
    const days = allPages().filter((p) => !p.isNight);
    for (let d = 0; d < 60; d++) {
      const date = new Date(2026, 0, 1 + d);
      expect(dailyPuzzle(localDay(date), days)).not.toBeNull();
    }
  });
});

describe('chapter mysteries', () => {
  const chapters = COUNTRIES.flatMap((c) => c.chapters.map((chapter): [string, Chapter] => [`${c.id}/${chapter.id}`, chapter]));

  test.each(chapters)('%s: a question has its fragments, fragments have their question', (_id, chapter) => {
    const clues = cluesOf(chapter);
    if (!chapter.mystery) {
      expect(clues).toEqual([]);
      return;
    }
    expect(clues.length).toBeGreaterThan(0);
    expect(chapter.mystery.question).toBeTruthy();
    expect(chapter.mystery.options.length).toBeGreaterThanOrEqual(2);
    expect(chapter.mystery.options.filter((o) => o.correct)).toHaveLength(1);
    expect(chapter.mystery.epilogue.length).toBeGreaterThan(0);
    for (const { object } of clues) {
      // Optional, like a critter: the case closes without it
      expect(object.isBonus || object.isSecret).toBeFalsy();
      expect(object.foundText).toBeTruthy();
    }
  });
});

describe.each(allPages().map((page): [string, Page] => [page.id, page]))('%s, other hunts', (_id, page) => {
  test('other hiding places are on the paper, each with its clue, never for moving creatures', () => {
    for (const o of page.objects) {
      if (!o.spots) continue;
      expect(o.roam || o.shy).toBeFalsy();
      expect(o.spots.length).toBeGreaterThan(0);
      for (const s of o.spots) {
        expect(onPaper(s.x, s.y)).toBe(true);
        expect(s.clue).toBeTruthy();
        expect(s.clue).not.toBe(o.clue);
        if (s.radius !== undefined) expect(s.radius).toBeGreaterThan(0);
        if (s.occluder) expect(s.occluder.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test('golden critters are a visit thing, never written in a page', () => {
    for (const o of page.objects) expect(o.rare).toBeUndefined();
  });

  test('riddles have words; a sequence counts 1, 2, 3… on objects that must be found', () => {
    for (const o of page.objects) if (o.riddle !== undefined) expect(o.riddle.trim()).toBeTruthy();
    const orders = page.objects.filter((o) => o.order !== undefined);
    for (const o of orders) expect(isMainObject(o)).toBe(true);
    expect(orders.map((o) => o.order).sort((a, b) => a! - b!)).toEqual(orders.map((_, i) => i + 1));
  });
});

test('every creature startles its own way when caught; objects do not', () => {
  const kinds = Object.entries(BESTIARY);
  expect(kinds.filter(([type, e]) => e.kind === 'creature' && !STARTLE[type as keyof typeof STARTLE]).map(([type]) => type)).toEqual([]);
  expect(kinds.filter(([type, e]) => e.kind === 'object' && STARTLE[type as keyof typeof STARTLE]).map(([type]) => type)).toEqual([]);
});
