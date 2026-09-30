import { HiddenObject } from '../types/level';
import { isShyVisible } from './ShyClock';

export interface DetectionResult {
  hit: boolean;
  object?: HiddenObject;
  distance: number;
  // A shy creature was right here but is currently hiding — not a mistake, just bad timing.
  hidingObject?: HiddenObject;
}

/**
 * Checks if normalized coordinates (0.0 - 1.0) fall within an unfound hidden object's radius.
 * Accounts for 1760/1240 aspect ratio of the sketchbook spread.
 * When hit areas overlap, the nearest object wins.
 */
export function detectObject(
  nx: number,
  ny: number,
  objects: HiddenObject[],
  foundIds: string[],
  now: number = performance.now()
): DetectionResult {
  const ASPECT_RATIO = 1760 / 1240; // ~1.419

  let closestObject: HiddenObject | undefined = undefined;
  let minDistance = Infinity;
  let hitObject: HiddenObject | undefined = undefined;
  let hitDistance = Infinity;
  let hidingObject: HiddenObject | undefined = undefined;

  for (const obj of objects) {
    if (foundIds.includes(obj.id)) continue;

    // Euclidean distance in aspect-corrected space
    const dx = (nx - obj.x) * ASPECT_RATIO;
    const dy = ny - obj.y;
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

    if (distance < hitDistance) {
      hitDistance = distance;
      hitObject = obj;
    }
  }

  if (hitObject) {
    return { hit: true, object: hitObject, distance: hitDistance };
  }

  return {
    hit: false,
    object: closestObject,
    distance: minDistance,
    hidingObject,
  };
}
