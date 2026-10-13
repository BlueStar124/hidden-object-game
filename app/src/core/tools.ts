import type { Country, GameProgress, ToolId } from './model';

/**
 * Checks whether all day pages of a country have been cleared (at least 1 star).
 */
export function isCountryCleared(progress: GameProgress, country: Country): boolean {
  for (const chapter of country.chapters) {
    for (const slot of chapter.pages) {
      const stars = progress.sceneResults[slot.day.id]?.stars ?? 0;
      if (stars <= 0) return false;
    }
  }
  return true;
}

/**
 * Derives the tools owned by the player from their game progress.
 * Completing Singapore unlocks the 'uv-lens'.
 */
export function toolsOwned(progress: GameProgress, countries: Country[]): ToolId[] {
  const tools: ToolId[] = [];
  const singapore = countries.find((c) => c.id === 'singapore');
  if (singapore && isCountryCleared(progress, singapore)) {
    tools.push('uv-lens');
  }
  return tools;
}

