import { Skia, type SkRect } from '@shopify/react-native-skia';
import { SPRITE_BASE_WIDTH, type HiddenObject, type Page } from '../../core/model';
import { hashString, rng } from '../../core/random';
import { PAGE_H, PAGE_W, PX } from '../constants';
import type { NightScene, RevealBlob } from '../render/types';
import { lampShader, moonPath } from './paints';

// Fixed star field in the upper part of the spread (normalized x, y, size)
export const STARS: [number, number, number][] = [
  [0.06, 0.08, 1.2],
  [0.13, 0.16, 0.8],
  [0.21, 0.06, 1],
  [0.29, 0.13, 0.7],
  [0.36, 0.05, 1.3],
  [0.44, 0.11, 0.8],
  [0.57, 0.07, 1.1],
  [0.63, 0.15, 0.7],
  [0.71, 0.05, 0.9],
  [0.78, 0.12, 1.2],
  [0.86, 0.07, 0.8],
  [0.93, 0.14, 1],
  [0.1, 0.25, 0.7],
  [0.52, 0.2, 0.9],
  [0.9, 0.24, 0.7],
];

export function buildNight(page: Page): NightScene {
  const r = 0.016 * PAGE_W;
  return {
    lamps: (page.nightLights ?? []).map((l, i) => ({
      x: l.x * PAGE_W,
      y: l.y * PAGE_H,
      hole: l.r * PAGE_W * 1.15,
      glow: l.r * PAGE_W,
      shader: lampShader(l.color),
      delay: ((i * 0.53) % 4) * 1000,
    })),
    stars: STARS.map(([x, y, s], i) => ({ x: x * PAGE_W, y: y * PAGE_H, r: 1.5 * s * PX, delay: ((i * 0.37) % 3) * 1000 })),
    moon: moonPath(0.07 * PAGE_W + r, 0.07 * PAGE_H + r, r),
  };
}

/** The four rectangles of the spread around a focus (page units), laid out once. */
export function veilAround(f: SkRect): SkRect[] {
  const right = f.x + f.width;
  const bottom = f.y + f.height;
  return [
    Skia.XYWHRect(0, 0, PAGE_W, f.y),
    Skia.XYWHRect(0, bottom, PAGE_W, PAGE_H - bottom),
    Skia.XYWHRect(0, f.y, f.x, f.height),
    Skia.XYWHRect(right, f.y, PAGE_W - right, f.height),
  ];
}

// The patch a find washes clear: this many times the sprite's width, within these bounds (page units)
export const REVEAL_SPAN = 3.2;
export const REVEAL_MIN = 110;
export const REVEAL_MAX = 230;

/** An irregular patch, the same every time for an object: one round and two smaller ones beside it. */
export function revealBlobs(obj: HiddenObject): RevealBlob[] {
  const radius = Math.min(REVEAL_MAX, Math.max(REVEAL_MIN, REVEAL_SPAN * SPRITE_BASE_WIDTH * (obj.scale ?? 1) * PAGE_W));
  const random = rng(hashString(obj.id));
  const blobs: RevealBlob[] = [{ dx: 0, dy: 0, r: radius }];
  for (let i = 0; i < 2; i++) {
    const angle = random() * Math.PI * 2;
    const reach = radius * (0.45 + 0.2 * random());
    blobs.push({ dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach, r: radius * (0.5 + 0.2 * random()) });
  }
  return blobs;
}

