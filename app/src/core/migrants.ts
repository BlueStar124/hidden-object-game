import type { HiddenObject, SpriteType } from './model';
import { hashString, rng } from './random';

export interface MigrantSpot {
  pageId: string;
  spotId: string;
  x: number;
  y: number;
  radius: number;
  scale?: number;
  clue: string;
}

export interface Migrant {
  id: string;
  spriteType: SpriteType;
  name: string;
  story: string;
  spots: MigrantSpot[];
}

/**
 * Computes which migrants are visiting the specified page on a given day.
 * Each migrant picks a spot deterministically based on seed `hashString(id + ':' + day)`.
 */
export function migrantsOn(pageId: string, day: string, migrants: readonly Migrant[]): HiddenObject[] {
  const result: HiddenObject[] = [];
  for (const m of migrants) {
    if (m.spots.length === 0) continue;
    const r = rng(hashString(`${m.id}:${day}`));
    const chosenIndex = Math.floor(r() * m.spots.length);
    const spot = m.spots[Math.min(chosenIndex, m.spots.length - 1)];
    if (spot.pageId === pageId) {
      result.push({
        id: `${m.id}@${spot.spotId}`,
        name: m.name,
        clue: spot.clue,
        x: spot.x,
        y: spot.y,
        radius: spot.radius,
        scale: spot.scale,
        spriteType: m.spriteType,
        score: 150,
        isBonus: true,
      });
    }
  }
  return result;
}

