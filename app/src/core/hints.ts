import type { ActiveHint, HiddenObject } from './model';

/**
 * Two-step progressive hints per object (costing more per tier, see scoring.hintPenalty):
 * Tier 1: Reveals the hidden object's text and clue description on its card.
 * Tier 2: Reveals the object's exact position with radar ping and loupe nudge.
 */
export interface HintResult {
  level: 1 | 2 | 3;
  targetObject: HiddenObject;
  clueText: string;
  nudgeDirection?: { x: number; y: number }; // Unit vector pointing toward target
  radarPoint?: { x: number; y: number };
}

export function nextHint(
  activeHint: ActiveHint | null,
  revealedTextIds: string[],
  objects: HiddenObject[],
  foundIds: string[],
  currentLoupePos: { nx: number; ny: number },
  targetObjectId?: string
): HintResult | null;
export function nextHint(
  currentHintLevel: number,
  objects: HiddenObject[],
  foundIds: string[],
  currentLoupePos: { nx: number; ny: number }
): HintResult | null;
export function nextHint(
  arg1: ActiveHint | null | number,
  arg2: string[] | HiddenObject[],
  arg3: HiddenObject[] | string[],
  arg4: string[] | { nx: number; ny: number },
  arg5?: { nx: number; ny: number } | string,
  arg6?: string
): HintResult | null {
  // Legacy signature: (number, HiddenObject[], string[], { nx, ny })
  if (typeof arg1 === 'number') {
    const currentHintLevel = arg1;
    const objects = arg2 as HiddenObject[];
    const foundIds = arg3 as string[];
    const currentLoupePos = arg4 as { nx: number; ny: number };

    const unfound = objects.filter((o) => !foundIds.includes(o.id) && !o.isBonus);
    if (unfound.length === 0) return null;

    const normalUnfound = unfound.filter((o) => !o.isSecret);
    const target = normalUnfound.length > 0 ? normalUnfound[0] : unfound[0];
    const nextLevel = Math.min(3, Math.max(1, currentHintLevel + 1)) as 1 | 2 | 3;

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

  // Modern 2-step per-object signature:
  const activeHint = arg1 as ActiveHint | null;
  const revealedTextIds = (arg2 as string[]) ?? [];
  const objects = arg3 as HiddenObject[];
  const foundIds = arg4 as string[];
  const currentLoupePos = (arg5 as { nx: number; ny: number }) ?? { nx: 0.5, ny: 0.5 };
  const targetObjectId = arg6;

  // Filter unfound objects; bonus critters are never hinted
  const unfound = objects.filter((o) => !foundIds.includes(o.id) && !o.isBonus);
  if (unfound.length === 0) return null;

  const normalUnfound = unfound.filter((o) => !o.isSecret);
  const pool = normalUnfound.length > 0 ? normalUnfound : unfound;

  let target: HiddenObject | undefined;
  let targetLevel: 1 | 2 = 1;

  if (targetObjectId) {
    // Specific object requested (e.g. card tap)
    target = pool.find((o) => o.id === targetObjectId);
    if (!target) return null;

    if (!revealedTextIds.includes(target.id)) {
      targetLevel = 1;
    } else {
      targetLevel = 2;
    }
  } else {
    // General hint via HUD button:
    // If there is currently an active hint for an unfound item in the pool:
    if (activeHint && pool.some((o) => o.id === activeHint.objectId)) {
      const activeTarget = pool.find((o) => o.id === activeHint.objectId)!;
      if (activeHint.level === 1) {
        // Step 2: reveal position for this object
        target = activeTarget;
        targetLevel = 2;
      } else {
        // Step 2 was already active on this object.
        // Check if there are other unrevealed objects in the pool
        const nextUnrevealed = pool.find((o) => !revealedTextIds.includes(o.id));
        if (nextUnrevealed) {
          target = nextUnrevealed;
          targetLevel = 1;
        } else {
          // Keep/refresh position for current target
          target = activeTarget;
          targetLevel = 2;
        }
      }
    } else {
      // Pick first object whose text is not revealed yet -> Step 1
      const unrevealed = pool.find((o) => !revealedTextIds.includes(o.id));
      if (unrevealed) {
        target = unrevealed;
        targetLevel = 1;
      } else {
        // All objects already have text revealed -> pick first unfound to show position
        target = pool[0];
        targetLevel = 2;
      }
    }
  }

  const dx = target.x - currentLoupePos.nx;
  const dy = target.y - currentLoupePos.ny;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nudgeDirection = dist > 0.001 ? { x: dx / dist, y: dy / dist } : { x: 0, y: 0 };

  return {
    level: targetLevel,
    targetObject: target,
    clueText: target.clue,
    nudgeDirection: targetLevel >= 2 ? nudgeDirection : undefined,
    radarPoint: targetLevel >= 2 ? { x: target.x, y: target.y } : undefined,
  };
}
