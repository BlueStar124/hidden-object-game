import type { HiddenObject, Page, ToolId } from './model';
import { hashString, rng } from './random';

export const RARE_CHANCE = 1 / 40;

/**
 * Context for a single visit to a page:
 * - seed: deterministic random seed (e.g. from pageId + playCount, or challenge code).
 *   If undefined or 0, original object positions are preserved.
 * - day: current local day ('YYYY-MM-DD').
 * - tools: tools currently owned by the player.
 * - migrants: visiting creatures assigned to this page on this day.
 * - rareChance: probability of a bonus critter becoming a rare variant (defaults to 1/40).
 */
export interface VisitContext {
  seed?: number;
  day?: string;
  tools?: ToolId[];
  migrants?: HiddenObject[];
  rareChance?: number;
}

/**
 * The page as this visit plays it: chosen spots, visiting creatures, rare variants, tool-gated objects.
 * When ctx is omitted or empty, returns the original page unmodified.
 */
export function resolvePage(page: Page, ctx?: VisitContext): Page {
  if (!ctx) return page;

  const { seed, tools = [], migrants = [], rareChance = RARE_CHANCE } = ctx;

  // 1. Tool gating: filter out objects requiring unowned tools
  let objects = page.objects.filter((obj) => {
    if (obj.requires && !tools.includes(obj.requires)) {
      return false;
    }
    return true;
  });

  // 2. Alternative spots & rare variants if seed is provided
  if (seed !== undefined && seed !== 0) {
    objects = objects.map((obj) => {
      let resolved = obj;

      // Alternative spots (only for stationary objects without roam or shy)
      if (obj.spots && obj.spots.length > 0 && !obj.roam && !obj.shy) {
        const spotRng = rng((hashString(obj.id) ^ seed) >>> 0);
        // Spot 0 is the original spot; subsequent spots are alternatives
        const allSpots = [
          {
            x: obj.x,
            y: obj.y,
            radius: obj.radius,
            rotation: obj.rotation,
            scale: obj.scale,
            occluder: obj.occluder,
            clue: obj.clue,
          },
          ...obj.spots,
        ];
        const chosenIndex = Math.floor(spotRng() * allSpots.length);
        const chosen = allSpots[Math.min(chosenIndex, allSpots.length - 1)];

        resolved = {
          ...resolved,
          x: chosen.x,
          y: chosen.y,
          radius: chosen.radius ?? obj.radius,
          rotation: chosen.rotation ?? obj.rotation,
          scale: chosen.scale ?? obj.scale,
          occluder: chosen.occluder !== undefined ? chosen.occluder : obj.occluder,
          clue: chosen.clue,
        };
      }

      // Rare shiny variant chance for bonus critters
      if (obj.isBonus && !obj.isSecret) {
        const rareRng = rng((hashString(`${obj.id}:rare`) ^ seed) >>> 0);
        if (rareRng() < rareChance) {
          resolved = { ...resolved, rare: true };
        }
      }

      return resolved;
    });
  }

  // 3. Inject visiting migrants
  if (migrants.length > 0) {
    const existingIds = new Set(objects.map((o) => o.id));
    const newMigrants = migrants.filter((m) => !existingIds.has(m.id));
    objects = [...objects, ...newMigrants];
  }

  const hasModifications = (seed !== undefined && seed !== 0) || tools.length > 0 || migrants.length > 0;
  const variantKey = hasModifications ? `${page.id}:s${seed ?? 0}:t${tools.join(',')}:m${migrants.length}` : undefined;

  return {
    ...page,
    objects,
    variantKey,
  };
}
