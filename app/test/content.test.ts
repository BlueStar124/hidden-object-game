import { describe, expect, test } from '@jest/globals';
import { allPages, artOf, COUNTRIES, pagesOf } from '../src/content';
import { BESTIARY } from '../src/content/bestiary';
import { isMainObject, type Page } from '../src/core/model';
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
