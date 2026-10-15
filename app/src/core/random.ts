/**
 * Chance that can be replayed: the same seed gives the same draws on every device, so a daily page
 * or a friend's challenge code is the same puzzle for everyone — without a server.
 */

/** Seeds fit in 20 bits: four characters of a challenge code (core/challenge). */
export const SEED_BITS = 20;
export const SEED_COUNT = 1 << SEED_BITS;

/** A 32-bit FNV-1a hash of a string. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Numbers in [0, 1) drawn from a seed (mulberry32): small, fast, and the same everywhere. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number in [0, count). */
export const draw = (random: () => number, count: number) => Math.floor(random() * count);

/** The items in a shuffled order (a new array; Fisher–Yates). */
export function shuffled<T>(random: () => number, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = draw(random, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The player's calendar day, '2026-10-12': local time, not UTC (`toISOString` would turn the day
 * over at 7 in the morning in Vietnam).
 */
export function localDay(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}
