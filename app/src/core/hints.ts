import { nextInSequence, waitsInSequence } from './detection';
import type { ActiveHint, HiddenObject } from './model';

/**
 * Two steps of help per object, the second costing more (see scoring.hintPenalty). Clue cards start
 * with only the silhouette:
 * 1. the card shows the object's name and clue · 2. the loupe tugs towards it and a radar pulses on it.
 */
export interface HintResult {
  level: 1 | 2;
  targetObject: HiddenObject;
  clueText: string;
  nudgeDirection?: { x: number; y: number }; // Unit vector pointing toward target
  radarPoint?: { x: number; y: number };
}

/**
 * The next hint: for the object whose card was tapped (`targetId`), or — from the hint button —
 * the step after the active hint, else the first card still unread.
 */
export function nextHint(
  activeHint: ActiveHint | null,
  revealedIds: readonly string[],
  objects: HiddenObject[],
  foundIds: string[],
  currentLoupePos: { nx: number; ny: number },
  targetId?: string
): HintResult | null {
  // Main objects first, then the secret. Optional critters and mystery clues are for the
  // sharp-eyed only — never hinted; in a sequence hunt, only the object whose turn it is.
  const next = nextInSequence(objects, foundIds);
  const unfound = objects.filter((o) => !foundIds.includes(o.id) && !o.isBonus && !o.isClue && !waitsInSequence(o, next));
  if (unfound.length === 0) return null;
  const normal = unfound.filter((o) => !o.isSecret);
  const pool = normal.length > 0 ? normal : unfound;
  const unread = pool.find((o) => !revealedIds.includes(o.id));

  let target: HiddenObject | undefined;
  let level: 1 | 2;
  if (targetId) {
    // A card tapped: read it first, then point at it
    target = pool.find((o) => o.id === targetId);
    if (!target) return null;
    level = revealedIds.includes(target.id) ? 2 : 1;
  } else {
    const active = activeHint ? pool.find((o) => o.id === activeHint.objectId) : undefined;
    if (active && activeHint?.level === 1) {
      // The card was just read: now show where it is
      target = active;
      level = 2;
    } else if (unread) {
      target = unread;
      level = 1;
    } else {
      // Every card read: point at the one already pointed at, or the first left
      target = active ?? pool[0];
      level = 2;
    }
  }

  const dx = target.x - currentLoupePos.nx;
  const dy = target.y - currentLoupePos.ny;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nudgeDirection = dist > 0.001 ? { x: dx / dist, y: dy / dist } : { x: 0, y: 0 };

  return {
    level,
    targetObject: target,
    clueText: target.clue,
    nudgeDirection: level === 2 ? nudgeDirection : undefined,
    radarPoint: level === 2 ? { x: target.x, y: target.y } : undefined,
  };
}
