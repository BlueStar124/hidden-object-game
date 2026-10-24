import type { HiddenObject, Migrant, Page } from './model';
import { draw, hashString, rng } from './random';

/**
 * Travelling creatures: each day, every migrant is on one page of the books — the same page for every
 * player on that day, drawn from the date. Meeting one everywhere it goes tells its story. Its object on
 * a page is an optional critter whose id (`migrant-<id>`) stays the same, so finds are saved per page.
 */

/** Points for finding a migrant (an optional critter), on any page. */
export const MIGRANT_SCORE = 100;

/** The id of a migrant's object, on any page it visits. */
export const migrantObjectId = (m: Migrant) => `migrant-${m.id}`;

/** Where a migrant is on a day ('2026-10-12'): the index of one of its spots. */
export const migrantSpot = (m: Migrant, day: string) => draw(rng(hashString(`${m.id}:${day}`)), m.spots.length);

/** The page with the migrants visiting it that day (the page itself when none does). */
export function withVisitors(page: Page, day: string, migrants: readonly Migrant[]): Page {
  const visitors: HiddenObject[] = [];
  for (const m of migrants) {
    const spot = m.spots[migrantSpot(m, day)];
    if (spot.pageId !== page.id) continue;
    visitors.push({
      id: migrantObjectId(m),
      name: m.name,
      clue: spot.clue,
      x: spot.x,
      y: spot.y,
      radius: spot.radius ?? 0.03,
      score: MIGRANT_SCORE,
      isBonus: true,
      spriteType: m.spriteType,
      scale: spot.scale ?? 0.5,
      flip: spot.flip,
      camo: 'chameleon',
      foundText: m.greeting,
    });
  }
  if (!visitors.length) return page;
  // A visit of its own: the board's caches must tell it apart (core/layout.layoutKey)
  return { ...page, objects: [...page.objects, ...visitors], layout: `${page.layout ?? ''}v${visitors.map((v) => v.id).join('+')}` };
}

/** How many of a migrant's places the player has met it in; `seen` gives the objects found on a page. */
export function migrantProgress(m: Migrant, seen: (pageId: string) => string[]): { met: number; total: number } {
  const id = migrantObjectId(m);
  const pages = [...new Set(m.spots.map((s) => s.pageId))];
  return { met: pages.filter((p) => seen(p).includes(id)).length, total: pages.length };
}
