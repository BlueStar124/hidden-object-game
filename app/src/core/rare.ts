import type { Page } from './model';

/**
 * Golden critters: now and then, one of a page's optional critters is a rare golden one — a little
 * surprise worth coming back for. Decided once per visit from a roll in [0, 1) (the game rolls it;
 * it stays the same while the page is played), so the rule itself stays pure.
 */

/** How often a visit has a golden critter (when the page has critters at all). */
export const RARE_CHANCE = 1 / 25;

/** The page with one of its critters golden — or the page as it is, most visits. */
export function withRareCritter(page: Page, roll: number): Page {
  if (!(roll >= 0 && roll < RARE_CHANCE)) return page;
  const critters = page.objects.filter((o) => o.isBonus && o.spriteType && o.spriteType !== 'seal');
  if (!critters.length) return page;
  // The same roll picks which one: spread over the critters
  const pick = critters[Math.min(critters.length - 1, Math.floor((roll / RARE_CHANCE) * critters.length))];
  return {
    ...page,
    objects: page.objects.map((o) => (o === pick ? { ...o, rare: true } : o)),
    // Drawn differently: the board's caches must tell this visit apart (core/layout.layoutKey)
    layout: `${page.layout ?? ''}r${pick.id}`,
  };
}
