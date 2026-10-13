/**
 * Deterministic pseudo-random number generation and date utilities for offline gameplay.
 * Given the same seed, sequences are identical across devices without needing a backend.
 */

/**
 * 32-bit FNV-1a hash of an arbitrary string.
 */
export function hashString(str: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Fast, high-quality 32-bit PRNG generator (Mulberry32).
 * Returns floats in [0, 1).
 */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a random element from an array using the given PRNG.
 */
export function pick<T>(r: () => number, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  const idx = Math.floor(r() * items.length);
  return items[Math.min(idx, items.length - 1)];
}

/**
 * Returns a new array with elements shuffled using Fisher-Yates and the given PRNG.
 */
export function shuffle<T>(r: () => number, items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Format a Date as 'YYYY-MM-DD' according to the device's local timezone.
 * Avoids UTC day shift issues (e.g., Vietnam UTC+7 changing day at 7 AM UTC).
 */
export function localDay(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

