import type { Chapter, HiddenObject, Page } from './model';

/**
 * A chapter's mystery: clue fragments (HiddenObject.isClue) hidden across its pages, then a question
 * on the deduction board. A wrong answer never costs anything — it only points back at the clues.
 */

export interface ClueFragment {
  page: Page;
  object: HiddenObject;
}

/** Every clue fragment of a chapter, in reading order (day pages, then their nights). */
export function cluesOf(chapter: Chapter): ClueFragment[] {
  return chapter.pages.flatMap((slot) =>
    [slot.day, slot.night].flatMap((page) => (page ? page.objects.filter((o) => o.isClue).map((object) => ({ page, object })) : []))
  );
}

/** Whether a chapter has a mystery to solve (a question, and fragments to find for it). */
export const hasMystery = (chapter: Chapter) => !!chapter.mystery && cluesOf(chapter).length > 0;

/** How many of a chapter's fragments were found; `seen` gives the objects spotted on a page. */
export function mysteryProgress(chapter: Chapter, seen: (pageId: string) => string[]): { found: number; total: number } {
  const clues = cluesOf(chapter);
  return { found: clues.filter((c) => seen(c.page.id).includes(c.object.id)).length, total: clues.length };
}

/** The deduction board opens once every fragment is found. */
export function canDeduce(chapter: Chapter, seen: (pageId: string) => string[]): boolean {
  if (!hasMystery(chapter)) return false;
  const { found, total } = mysteryProgress(chapter, seen);
  return found === total;
}

/** Whether an answer (index into the mystery's options) is the right one. */
export const isRightAnswer = (chapter: Chapter, option: number) => !!chapter.mystery?.options[option]?.correct;
