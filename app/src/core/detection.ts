import type { HiddenObject } from './model';
import { isShyVisible, objectPosition } from './motion';

export interface DetectionResult {
  hit: boolean;
  object?: HiddenObject;
  distance: number;
  // Where the hit object was caught (roaming creatures move, so this differs from obj.x/y)
  position?: { x: number; y: number };
  // A shy creature was right here but is currently hiding — not a mistake, just bad timing.
  hidingObject?: HiddenObject;
  // Right object, too early in a sequence hunt — not a mistake either: the trail comes first.
  outOfTurn?: HiddenObject;
}

/** Sequence hunts: the lowest order not found yet (null when the page has no sequence left). */
export function nextInSequence(objects: HiddenObject[], foundIds: string[]): number | null {
  let next: number | null = null;
  for (const o of objects) {
    if (o.order === undefined || foundIds.includes(o.id)) continue;
    if (next === null || o.order < next) next = o.order;
  }
  return next;
}

/** An object of a sequence whose turn has not come yet. */
export const waitsInSequence = (o: HiddenObject, next: number | null) => o.order !== undefined && next !== null && o.order > next;

const ASPECT_RATIO = 1760 / 1240; // the sketchbook spread (~1.419)

/**
 * Checks if normalized coordinates (0.0 - 1.0) fall within an unfound hidden object's radius.
 * Distances are measured in aspect-corrected space; when hit areas overlap, the nearest wins.
 */
export function detectObject(
  nx: number,
  ny: number,
  objects: HiddenObject[],
  foundIds: string[],
  now: number = performance.now()
): DetectionResult {
  let closestObject: HiddenObject | undefined = undefined;
  let minDistance = Infinity;
  let hitObject: HiddenObject | undefined = undefined;
  let hitPosition: { x: number; y: number } | undefined = undefined;
  let hitDistance = Infinity;
  let hidingObject: HiddenObject | undefined = undefined;
  let outOfTurn: HiddenObject | undefined = undefined;
  const next = nextInSequence(objects, foundIds);

  for (const obj of objects) {
    if (foundIds.includes(obj.id)) continue;

    const pos = objectPosition(obj, now);
    const dx = (nx - pos.x) * ASPECT_RATIO;
    const dy = ny - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closestObject = obj;
    }

    if (distance > obj.radius * ASPECT_RATIO) continue;

    if (obj.shy && !isShyVisible(obj.shy, now)) {
      hidingObject = obj;
      continue;
    }

    if (waitsInSequence(obj, next)) {
      outOfTurn = obj;
      continue;
    }

    if (distance < hitDistance) {
      hitDistance = distance;
      hitObject = obj;
      hitPosition = pos;
    }
  }

  if (hitObject) {
    return { hit: true, object: hitObject, distance: hitDistance, position: hitPosition };
  }

  return {
    hit: false,
    object: closestObject,
    distance: minDistance,
    hidingObject,
    outOfTurn,
  };
}
