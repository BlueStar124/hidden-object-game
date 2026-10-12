import { layOutPage } from './layout';
import { isMainObject, type DailyStamp, type HiddenObject, type Page, type SpreadRect } from './model';
import { draw, hashString, rng, SEED_COUNT, shuffled } from './random';

/**
 * The daily page: a corner of one page of the books, a few objects to find in it, the same for every
 * player on the same day — drawn from the date, so no server decides it. It is a short hunt beside
 * the books: it never counts as playing the page itself, it earns a stamp in the passport.
 */

/** Seconds on the clock of a daily page. */
export const DAILY_TIME_LIMIT = 150;
/** How many objects a daily page asks for, at least and at most. */
export const DAILY_MIN_FINDS = 3;
export const DAILY_MAX_FINDS = 5;

// The part of the spread in play (fractions of the spread): about a third of the paper
const FOCUS_W = 0.4;
const FOCUS_H = 0.36;
// The paper of the sketchbook template, where everything is hidden (x 88–1672, y 270–969 of 1760 × 1240)
const PAPER = { x0: 88 / 1760, x1: 1672 / 1760, y0: 270 / 1240, y1: 969 / 1240 };
// Corners of the focus are tried on this grid (fractions of the spread)
const STEP = 0.025;
// Hit radii are fractions of the spread's width; heights are fractions of its height
const ASPECT = 1760 / 1240;

export interface DailyPuzzle {
  day: string; // core/random.localDay
  pageId: string;
  seed: number; // the page's layout (core/layout)
  focus: SpreadRect;
  objectIds: string[];
}

/** Objects a daily page can ask for: always where they are drawn (nothing roaming, no sequence). */
const fitsDaily = (o: HiddenObject) => isMainObject(o) && !o.roam && o.order === undefined;

function inside(o: HiddenObject, r: SpreadRect): boolean {
  const ry = o.radius * ASPECT;
  return o.x - o.radius >= r.x && o.x + o.radius <= r.x + r.w && o.y - ry >= r.y && o.y + ry <= r.y + r.h;
}

/** Every focus on the grid holding enough objects, with the objects it holds. */
function focusesOf(page: Page): { focus: SpreadRect; objects: HiddenObject[] }[] {
  const candidates = page.objects.filter(fitsDaily);
  const found: { focus: SpreadRect; objects: HiddenObject[] }[] = [];
  for (let x = PAPER.x0; x + FOCUS_W <= PAPER.x1 + 1e-9; x += STEP) {
    for (let y = PAPER.y0; y + FOCUS_H <= PAPER.y1 + 1e-9; y += STEP) {
      const focus = { x, y, w: FOCUS_W, h: FOCUS_H };
      const objects = candidates.filter((o) => inside(o, focus));
      if (objects.length >= DAILY_MIN_FINDS) found.push({ focus, objects });
    }
  }
  return found;
}

/** The daily page of a day, chosen among `pages` (day pages); null if none has room for one. */
export function dailyPuzzle(day: string, pages: Page[]): DailyPuzzle | null {
  const random = rng(hashString(`daily:${day}`));
  for (const page of shuffled(random, pages)) {
    const seed = 1 + draw(random, SEED_COUNT - 1);
    const focuses = focusesOf(layOutPage(page, seed));
    if (!focuses.length) continue;
    const { focus, objects } = focuses[draw(random, focuses.length)];
    const picked = shuffled(random, objects).slice(0, DAILY_MAX_FINDS);
    return { day, pageId: page.id, seed, focus, objectIds: picked.map((o) => o.id) };
  }
  return null;
}

/** The page as the daily hunt plays it: only its objects, framed on its focus, a shorter clock. */
export function dailyPage(page: Page, puzzle: DailyPuzzle): Page {
  const laidOut = layOutPage(page, puzzle.seed);
  return {
    ...laidOut,
    objects: laidOut.objects.filter((o) => puzzle.objectIds.includes(o.id)),
    focus: puzzle.focus,
    timeLimit: DAILY_TIME_LIMIT,
    layout: `d${puzzle.day}`,
  };
}

/** Daily stamps of one country that earn its gold seal in the passport (any days, no streak). */
export const STAMPS_FOR_SEAL = 7;

/** How many stamps each country has (by country id). */
export function stampsByCountry(stamps: Record<string, DailyStamp>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const s of Object.values(stamps)) counts.set(s.countryId, (counts.get(s.countryId) ?? 0) + 1);
  return counts;
}

/** Whether a spot (normalized) is in play: anywhere, unless the page is a daily crop. */
export function inFocus(page: Page, nx: number, ny: number): boolean {
  const f = page.focus;
  return !f || (nx >= f.x && nx <= f.x + f.w && ny >= f.y && ny <= f.y + f.h);
}
