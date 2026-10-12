import { SEED_BITS, SEED_COUNT } from './random';

/**
 * Challenge codes: "SG3-7K2P-142" is page 3 of the Singapore sketchbook ("SG3N": its night), laid out
 * with seed 7K2P (core/layout), done in 142 seconds. Everything is in the code, so a friend plays the
 * very same hunt without any server; the time is only there to beat, nobody checks it.
 */

export interface Challenge {
  country: string; // Country.code
  page: number; // page number in that country's book (1-based, as shown to players)
  night: boolean;
  seed: number;
  time?: number; // seconds, to beat
}

// Crockford's base 32: no I, L, O or U, so a code read aloud or copied by hand stays unambiguous
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SEED_CHARS = SEED_BITS / 5;
const MAX_TIME = 99_999; // seconds

function toBase32(value: number): string {
  let out = '';
  for (let i = 0; i < SEED_CHARS; i++) {
    out = ALPHABET[value & 31] + out;
    value >>>= 5;
  }
  return out;
}

function fromBase32(text: string): number | null {
  let value = 0;
  for (const ch of text) {
    // Read as Crockford intends: O is a zero, I and L are ones
    const digit = ALPHABET.indexOf(ch === 'O' ? '0' : ch === 'I' || ch === 'L' ? '1' : ch);
    if (digit < 0) return null;
    value = value * 32 + digit;
  }
  return value;
}

/** The code of a hunt. */
export function encodeChallenge(c: Challenge): string {
  const page = `${c.country}${c.page}${c.night ? 'N' : ''}`;
  const seed = toBase32(Math.max(0, Math.min(SEED_COUNT - 1, Math.floor(c.seed))));
  const time = c.time !== undefined && c.time > 0 ? `-${Math.min(MAX_TIME, Math.round(c.time))}` : '';
  return `${page}-${seed}${time}`;
}

// Anywhere in what was pasted (a whole message, a link): letters, page number, seed, optional time
const CODE = new RegExp(`([A-Z]{2})(\\d{1,3})(N?)-([0-9A-Z]{${SEED_CHARS}})(?:-(\\d{1,5}))?(?![0-9A-Z])`);

/** The hunt a code describes, or null if there is no code in the text. */
export function parseChallenge(text: string): Challenge | null {
  const m = CODE.exec(text.toUpperCase());
  if (!m) return null;
  const seed = fromBase32(m[4]);
  const page = Number(m[2]);
  if (seed === null || page < 1) return null;
  const time = m[5] ? Number(m[5]) : undefined;
  return { country: m[1], page, night: m[3] === 'N', seed, ...(time ? { time } : {}) };
}
