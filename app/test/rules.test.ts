import { describe, expect, test } from '@jest/globals';
import { clockTick, COMBO_WINDOW, leftovers, openCase, recordExploreFind, recordFind, recordHint, recordMiss } from '../src/core/caseFile';
import { detectObject } from '../src/core/detection';
import { nextHint } from '../src/core/hints';
import { isShyVisible, objectPosition, roamState, shyPhase } from '../src/core/motion';
import type { HiddenObject, Page, RoamBehavior, ShyBehavior } from '../src/core/model';
import { completionBonus, foundScore, hintPenalty, mistakePenalty } from '../src/core/scoring';

const object = (id: string, extra: Partial<HiddenObject> = {}): HiddenObject => ({
  id,
  name: id,
  clue: `clue of ${id}`,
  x: 0.5,
  y: 0.5,
  radius: 0.035,
  score: 100,
  spriteType: 'compass',
  ...extra,
});

/** A time on the creature clock at which a cycle of `period` seconds is at `phase` (0–1). */
function atPhase(period: number, phase: number): number {
  const now = performance.now();
  const current = shyPhase({ period }, now);
  return now + ((phase - current + 1) % 1) * period * 1000;
}

describe('scoring', () => {
  test('a find scores its points times the combo, plus 50 per combo step', () => {
    expect(foundScore(100, 1, 0)).toEqual({ earnedScore: 100, newScore: 100, combo: 1 });
    expect(foundScore(100, 2, 100)).toEqual({ earnedScore: 250, newScore: 350, combo: 2 });
    expect(foundScore(100, 3, 350)).toEqual({ earnedScore: 400, newScore: 750, combo: 3 });
    expect(foundScore(100, 0, 0).combo).toBe(1);
  });

  test('penalties never take the score below zero', () => {
    expect(mistakePenalty(50)).toBe(30);
    expect(mistakePenalty(10)).toBe(0);
    expect([1, 2, 3].map((level) => hintPenalty(200, level))).toEqual([150, 100, 50]);
    expect(hintPenalty(30, 3)).toBe(0);
  });

  test('closing a case: 4 points per second left, stars for a clean investigation', () => {
    expect(completionBonus(80, 1, 0)).toEqual({ timeBonus: 320, stars: 3 });
    expect(completionBonus(10.7, 0, 0).timeBonus).toBe(42);
    expect(completionBonus(60, 0, 0).stars).toBe(2); // three stars need more than a minute left
    expect(completionBonus(40, 4, 2).stars).toBe(2);
    expect(completionBonus(20, 8, 3).stars).toBe(1);
  });
});

describe('detection', () => {
  const now = performance.now();

  test('a tap on an unfound object hits it; found objects are ignored', () => {
    const target = object('target');
    expect(detectObject(0.5, 0.5, [target], [], now)).toMatchObject({ hit: true, object: target, position: { x: 0.5, y: 0.5 } });
    expect(detectObject(0.5, 0.5, [target], ['target'], now).hit).toBe(false);
  });

  test('a miss reports the nearest object', () => {
    const near = object('near', { x: 0.3 });
    const far = object('far', { x: 0.9 });
    const miss = detectObject(0.1, 0.5, [far, near], [], now);
    expect(miss.hit).toBe(false);
    expect(miss.object).toBe(near);
  });

  test('when hit areas overlap, the nearest object wins', () => {
    const a = object('a', { x: 0.5, radius: 0.05 });
    const b = object('b', { x: 0.52, radius: 0.05 });
    expect(detectObject(0.515, 0.5, [a, b], [], now).object).toBe(b);
    expect(detectObject(0.505, 0.5, [a, b], [], now).object).toBe(a);
  });

  test('the hit radius is a fraction of the page width, in both directions', () => {
    // The spread is 1760 × 1240: 0.035 of its width is 0.0497 of its height
    const target = object('target');
    expect(detectObject(0.5 + 0.04, 0.5, [target], [], now).hit).toBe(false);
    expect(detectObject(0.5, 0.5 + 0.045, [target], [], now).hit).toBe(true);
  });

  test('a shy creature can only be caught while it peeks out', () => {
    const shy: ShyBehavior = { period: 6 };
    const creature = object('gecko', { shy });
    const hidden = atPhase(shy.period, 0.7);
    const out = atPhase(shy.period, 0.2);
    expect(isShyVisible(shy, hidden)).toBe(false);
    expect(detectObject(0.5, 0.5, [creature], [], hidden)).toMatchObject({ hit: false, hidingObject: creature });
    expect(detectObject(0.5, 0.5, [creature], [], out)).toMatchObject({ hit: true, object: creature });
  });

  test('a roaming creature is caught where it is drawn at that moment', () => {
    const roam: RoamBehavior = { path: [[0.2, 0.5], [0.8, 0.5]], period: 10 };
    const creature = object('firefly', { x: 0.2, y: 0.5, roam });
    const t = atPhase(roam.period, 0.25);
    const drawn = objectPosition(creature, t);
    expect(drawn.x).toBeGreaterThan(0.3);
    expect(detectObject(0.2, 0.5, [creature], [], t).hit).toBe(false);
    const hit = detectObject(drawn.x, drawn.y, [creature], [], t);
    expect(hit.hit).toBe(true);
    expect(hit.position).toEqual(drawn);
  });
});

describe('creature motion', () => {
  test('cycles repeat exactly, and an offset shifts them', () => {
    const now = performance.now();
    expect(shyPhase({ period: 7, offset: 1.5 }, now + 7000)).toBeCloseTo(shyPhase({ period: 7, offset: 1.5 }, now), 6);
    expect(shyPhase({ period: 8, offset: 2 }, now)).toBeCloseTo(shyPhase({ period: 8 }, now + 2000), 6);
  });

  test('a ping-pong roamer goes there and back, facing its way', () => {
    const roam: RoamBehavior = { path: [[0.2, 0.4], [0.8, 0.6]], period: 10, facing: 'right' };
    const start = roamState(roam, atPhase(10, 0));
    const end = roamState(roam, atPhase(10, 0.5));
    expect(start.x).toBeCloseTo(0.2, 3);
    expect(start.y).toBeCloseTo(0.4, 3);
    expect(end.x).toBeCloseTo(0.8, 3);
    expect(end.y).toBeCloseTo(0.6, 3);
    expect(roamState(roam, atPhase(10, 0.25)).flip).toBe(false);
    expect(roamState(roam, atPhase(10, 0.75)).flip).toBe(true);
  });

  test('a looping roamer comes back to its first point', () => {
    const roam: RoamBehavior = { path: [[0.2, 0.2], [0.8, 0.2], [0.5, 0.8]], period: 12, loop: true };
    const t = atPhase(12, 0.999);
    const state = roamState(roam, t);
    expect(state.x).toBeCloseTo(0.2, 2);
    expect(state.y).toBeCloseTo(0.2, 2);
  });
});

describe('hints', () => {
  const objects = [
    object('first', { x: 0.6, y: 0.5 }),
    object('second'),
    object('secret', { isSecret: true }),
    object('critter', { isBonus: true }),
  ];
  const loupe = { nx: 0.1, ny: 0.5 };

  test('three tiers: the clue, a nudge of the loupe, then a radar pulse', () => {
    expect(nextHint(0, objects, [], loupe)).toMatchObject({ level: 1, clueText: 'clue of first', nudgeDirection: undefined, radarPoint: undefined });
    expect(nextHint(1, objects, [], loupe)).toMatchObject({ level: 2, nudgeDirection: { x: 1, y: 0 }, radarPoint: undefined });
    expect(nextHint(2, objects, [], loupe)).toMatchObject({ level: 3, radarPoint: { x: 0.6, y: 0.5 } });
    expect(nextHint(5, objects, [], loupe)?.level).toBe(3);
  });

  test('progressive 2-step hints per object: step 1 reveals text, step 2 reveals position', () => {
    // Initially, no text revealed
    const step1 = nextHint(null, [], objects, [], loupe);
    expect(step1).toMatchObject({ level: 1, targetObject: objects[0], clueText: 'clue of first', radarPoint: undefined });

    // With active hint at level 1 on 'first', asking again yields level 2 (position) on 'first'
    const step2 = nextHint({ level: 1, objectId: 'first' }, ['first'], objects, [], loupe);
    expect(step2).toMatchObject({ level: 2, targetObject: objects[0], radarPoint: { x: 0.6, y: 0.5 } });

    // When 'first' is found, next hint targets 'second' at level 1
    const nextObjStep1 = nextHint(null, ['first'], objects, ['first'], loupe);
    expect(nextObjStep1).toMatchObject({ level: 1, targetObject: objects[1], radarPoint: undefined });
  });

  test('targeted hint directly on a specific object card', () => {
    // Tapping 'second' card directly while 'first' is unrevealed
    const targetedStep1 = nextHint(null, [], objects, [], loupe, 'second');
    expect(targetedStep1).toMatchObject({ level: 1, targetObject: objects[1], radarPoint: undefined });

    // Tapping 'second' card again when its text is revealed yields position
    const targetedStep2 = nextHint({ level: 1, objectId: 'second' }, ['second'], objects, [], loupe, 'second');
    expect(targetedStep2).toMatchObject({ level: 2, targetObject: objects[1], radarPoint: { x: 0.5, y: 0.5 } });
  });
});

describe('case file', () => {
  const page: Page = {
    id: 'test-page',
    title: 'Test',
    subtitle: '',
    art: 'test',
    timeLimit: 120,
    storyClue: '',
    objects: [
      object('first'),
      object('second', { roam: { path: [[0.1, 0.1], [0.9, 0.9]], period: 8 } }),
      object('secret', { isSecret: true, score: 500 }),
      object('critter', { isBonus: true }),
    ],
  };
  const [first, second, secret, critter] = page.objects;

  test('opening a case starts the clock at the page time limit', () => {
    expect(openCase(page)).toMatchObject({ pageId: 'test-page', remainingTime: 120, score: 0, combo: 1, foundItems: [] });
  });

  test('finds build a combo, and the last main object closes the case with a bonus', () => {
    const opened = openCase(page);
    const one = recordFind(opened, page, first, undefined);
    expect(one).toMatchObject({ earned: 100, combo: 1, solved: null });
    expect(one.changes).toMatchObject({ combo: 2, comboTimer: COMBO_WINDOW, foundAt: {} });

    const afterOne = { ...opened, ...one.changes };
    const two = recordFind(afterOne, page, second, { x: 0.4, y: 0.4 });
    expect(two.earned).toBe(250);
    expect(two.solved).toEqual({ timeBonus: 480, stars: 3, score: 100 + 250 + 480 });
    expect(two.changes).toMatchObject({ isCompleted: true, foundAt: { second: { x: 0.4, y: 0.4 } } });
  });

  test('the secret is optional but recorded', () => {
    const found = recordFind(openCase(page), page, secret, undefined);
    expect(found.solved).toBeNull();
    expect(found.changes.secretFound).toBe(true);
  });

  test('a wrong guess costs points and breaks the combo', () => {
    const c = { ...openCase(page), score: 100, combo: 3, comboTimer: 4 };
    expect(recordMiss(c)).toMatchObject({ mistakes: 1, score: 80, combo: 1, comboTimer: 0 });
  });

  test('the clock runs down, an idle combo wears off, and time up ends the case', () => {
    let c = { ...openCase(page), remainingTime: 2, combo: 3, comboTimer: 1 };
    c = clockTick(c);
    expect(c).toMatchObject({ remainingTime: 1, combo: 1, comboTimer: 0, isGameOver: false });
    c = clockTick(c);
    expect(c).toMatchObject({ remainingTime: 0, isGameOver: true });
    expect(clockTick(c).remainingTime).toBe(0);
  });

  test('a hint costs points and is shown until the next find', () => {
    const c = { ...openCase(page), score: 300 };
    const hinted = recordHint(c, nextHint(1, page.objects, [], { nx: 0, ny: 0 })!);
    expect(hinted).toMatchObject({ hintsUsed: 1, score: 200, activeHint: { level: 2, objectId: 'first' } });
    expect(recordFind(hinted, page, first, undefined).changes.activeHint).toBeNull();
  });

  test('hint reveals text id and records it into revealedTextIds', () => {
    const opened = openCase(page);
    expect(opened.revealedTextIds).toEqual([]);
    const step1 = nextHint(null, opened.revealedTextIds, page.objects, [], { nx: 0, ny: 0 });
    const afterHint = recordHint(opened, step1!);
    expect(afterHint.revealedTextIds).toContain('first');
    expect(afterHint.activeHint?.level).toBe(1);
  });

  test('after the case is closed, leftovers can still be found for the album', () => {
    const closed = { ...openCase(page), foundItems: ['first', 'second'], isCompleted: true, score: 900 };
    expect(leftovers(closed, page)).toEqual([secret, critter]);
    const explored = recordExploreFind(closed, critter, { x: 0.3, y: 0.3 });
    expect(explored.score).toBe(900);
    expect(leftovers(explored, page)).toEqual([secret]);
  });
});
