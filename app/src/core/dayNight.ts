import type { Page } from './model';

/**
 * Day and night: a night page shares its painting with its day page, and on some of them a few things
 * of the day have moved once night fell (HiddenObject.dayTwin). Their clue cards say where they were by
 * day, and once one is found the board draws the way it went.
 */

// The night page with its day positions, per night page: the same object every time, so memoised
// components and the board's caches see one page
const twinned = new WeakMap<Page, Page>();

/** Whether a page has things that moved since the day (a day-and-night hunt). */
export const hasDayTwins = (page: Page) => page.objects.some((o) => !!o.dayTwin);

/** The night page with where its moved things were on `day` (the page itself when nothing moved). */
export function withDayTwins(night: Page, day: Page): Page {
  if (!hasDayTwins(night)) return night;
  let out = twinned.get(night);
  if (!out) {
    out = {
      ...night,
      objects: night.objects.map((o) => {
        const twin = o.dayTwin ? day.objects.find((d) => d.id === o.dayTwin) : undefined;
        return twin ? { ...o, dayAt: { x: twin.x, y: twin.y, clue: twin.clue } } : o;
      }),
      // Drawn with the ways they went: the board's caches must tell it apart (core/layout.layoutKey)
      layout: `${night.layout ?? ''}d`,
    };
    twinned.set(night, out);
  }
  return out;
}
