import type { HiddenObject } from './model';

/**
 * Three tiers of help, each costing more (see scoring.hintPenalty):
 * 1. the clue text again · 2. the loupe tugs towards the target · 3. a radar pulse on it.
 */
export interface HintResult {
  level: 1 | 2 | 3;
  targetObject: HiddenObject;
  clueText: string;
  nudgeDirection?: { x: number; y: number }; // Unit vector pointing toward target
  radarPoint?: { x: number; y: number };
}

export function nextHint(
  currentHintLevel: number,
  objects: HiddenObject[],
  foundIds: string[],
  currentLoupePos: { nx: number; ny: number }
): HintResult | null {
  // Pick the first unfound non-secret object (or secret if all normal found).
  // Optional hidden critters are for the sharp-eyed only — never hinted.
  const unfound = objects.filter((o) => !foundIds.includes(o.id) && !o.isBonus);
  if (unfound.length === 0) return null;

  const normalUnfound = unfound.filter((o) => !o.isSecret);
  const target = normalUnfound.length > 0 ? normalUnfound[0] : unfound[0];

  const nextLevel = Math.min(3, Math.max(1, currentHintLevel + 1)) as 1 | 2 | 3;

  // Direction vector from loupe center to target
  const dx = target.x - currentLoupePos.nx;
  const dy = target.y - currentLoupePos.ny;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nudgeDirection = dist > 0.001 ? { x: dx / dist, y: dy / dist } : { x: 0, y: 0 };

  return {
    level: nextLevel,
    targetObject: target,
    clueText: target.clue,
    nudgeDirection: nextLevel >= 2 ? nudgeDirection : undefined,
    radarPoint: nextLevel >= 3 ? { x: target.x, y: target.y } : undefined,
  };
}
