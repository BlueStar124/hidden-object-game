import type { HiddenObject, ObjectSpot, Page } from './model';
import { draw, hashString, rng } from './random';

/**
 * Where things are hidden on a visit. A page laid out for a seed keeps its id — progress is saved by
 * it — but objects with other hiding places (HiddenObject.spots) may take one of them, so a replay is
 * a new hunt. Seed 0 is the page exactly as written: a first visit, and what the clues were tuned on.
 */

/** Whether a replay of this page can differ from the first visit. */
export const hasSpots = (page: Page) => page.objects.some((o) => !!o.spots?.length);

/** The page laid out for a seed (the same page, untouched, for seed 0 or when nothing can move). */
export function layOutPage(page: Page, seed: number): Page {
  if (!seed || !hasSpots(page)) return page;
  const random = rng(hashString(`${page.id}:${seed}`));
  const objects = page.objects.map((o) => {
    if (!o.spots?.length) return o;
    const pick = draw(random, o.spots.length + 1); // 0: where the JSON puts it
    return pick === 0 ? o : placedAt(o, o.spots[pick - 1]);
  });
  return { ...page, objects, layout: `${page.layout ?? ''}s${seed}` };
}

function placedAt(o: HiddenObject, spot: ObjectSpot): HiddenObject {
  return {
    ...o,
    x: spot.x,
    y: spot.y,
    clue: spot.clue,
    radius: spot.radius ?? o.radius,
    scale: spot.scale ?? o.scale,
    rotation: spot.rotation ?? o.rotation,
    flip: spot.flip ?? o.flip,
    // What hides an object belongs to its spot
    occluder: spot.occluder,
  };
}

/** Tells layouts of the same page apart, for caches keyed by page (the board's scenes). */
export const layoutKey = (page: Page) => {
  const base = page.variantKey ?? page.id;
  return page.layout ? `${base}#${page.layout}` : base;
};
