import type { Chapter, Page, ToolId } from './model';

/**
 * The detective's tools: solving some chapter mysteries (Mystery.reward) hands one over, and with it
 * pages already played have something new — objects that need that tool (HiddenObject.requires) are
 * only there for a player who has it.
 */

/** The tools a player has: the rewards of the mysteries they solved. */
export function toolsOwned(chapters: readonly Chapter[], isSolved: (chapterId: string) => boolean): ToolId[] {
  const tools: ToolId[] = [];
  for (const chapter of chapters) {
    const reward = chapter.mystery?.reward;
    if (reward && isSolved(chapter.id) && !tools.includes(reward)) tools.push(reward);
  }
  return tools;
}

/** The chapter whose mystery hands a tool over (null: no chapter does). */
export const chapterGiving = (chapters: readonly Chapter[], tool: ToolId) => chapters.find((c) => c.mystery?.reward === tool) ?? null;

// Pages with their tool objects taken out, per page and set of tools: the same object every time,
// so memoised components and the board's caches see one page, not a new copy per render
const filtered = new WeakMap<Page, Map<string, Page>>();

/** The page as a player with these tools sees it: without the objects their tools do not reveal. */
export function withTools(page: Page, tools: readonly ToolId[]): Page {
  if (!page.objects.some((o) => o.requires && !tools.includes(o.requires))) return page;
  const key = [...tools].sort().join(',');
  let byTools = filtered.get(page);
  if (!byTools) filtered.set(page, (byTools = new Map()));
  let out = byTools.get(key);
  if (!out) {
    out = {
      ...page,
      objects: page.objects.filter((o) => !o.requires || tools.includes(o.requires)),
      // Fewer sprites than the page as written: the board's caches must tell it apart
      layout: `${page.layout ?? ''}t${key}`,
    };
    byTools.set(key, out);
  }
  return out;
}
