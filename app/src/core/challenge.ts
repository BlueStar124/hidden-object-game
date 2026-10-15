import { SEED_BITS, SEED_COUNT } from './random';
import type { CamoStyle, Page, SpriteType } from './model';

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

/** A player-authored hunt stored by the backend and placed over one bundled painting. */
export interface FriendChallenge {
  kind: 'friend';
  id: string;
  code: string;
  pageId: string;
  contentVersion: number;
  title: string;
  objects: FriendChallengeObject[];
  createdAt: string;
}

/** The fields the creator can choose for a hidden object. Coordinates use the full spread. */
export interface FriendChallengeObject {
  id: string;
  spriteType: Exclude<SpriteType, 'seal'>;
  name: string;
  clue: string;
  x: number;
  y: number;
  radius: number;
  scale?: number;
  rotation?: number;
  flip?: boolean;
  camo?: CamoStyle;
}

// Crockford's base 32: no I, L, O or U, so a code read aloud or copied by hand stays unambiguous
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SEED_CHARS = SEED_BITS / 5;
const MAX_TIME = 99_999; // seconds

/** Both creating and accepting a challenge require a prior visit to that exact day/night page. */
export function canChallengePage(pageId: string, playedPages: readonly string[]): boolean {
  return playedPages.includes(pageId);
}

/** Why a challenge cannot be played now (null: it can). */
export type ChallengeRefusal = 'missing' | 'unplayed' | 'turning' | 'newer';

/* ---- A friend's hunt (stored by the backend: platform/friendChallenges) ---- */

/**
 * The sprites a friend's hunt may use, as of this version of the books: bumped whenever sprites are
 * added (and the backend's challenge_sprites with them), so an older app refuses a hunt it cannot draw.
 */
export const FRIEND_CONTENT_VERSION = 1;
/** Where a friend's objects may go (parts of the spread), as the backend checks them too. */
export const FRIEND_AREA = { minX: 0.1, maxX: 0.9, minY: 0.27, maxY: 0.74 };
export const FRIEND_RADIUS = { min: 0.01, max: 0.06 };
export const FRIEND_MAX_OBJECTS = 20;
/** Points per object found in a friend's hunt (it counts for nothing in the books). */
export const FRIEND_OBJECT_SCORE = 100;

/** The sizes a friend's object can have: how big it is drawn (scale) with the touch area that fits it (radius). */
export type FriendSize = 'small' | 'medium' | 'large' | 'huge';
export const FRIEND_SIZES: Record<FriendSize, { scale: number; radius: number }> = {
  small: { scale: 0.6, radius: 0.022 },
  medium: { scale: 0.9, radius: 0.03 },
  large: { scale: 1.3, radius: 0.042 },
  huge: { scale: 1.8, radius: 0.055 },
};

/** The size an object was given (the nearest, for an object from an older app). */
export function friendSizeOf(object: Pick<FriendChallengeObject, 'scale'>): FriendSize {
  const scale = object.scale ?? FRIEND_SIZES.medium.scale;
  return (Object.keys(FRIEND_SIZES) as FriendSize[]).reduce((best, size) =>
    Math.abs(FRIEND_SIZES[size].scale - scale) < Math.abs(FRIEND_SIZES[best].scale - scale) ? size : best
  );
}

const FRIEND_CODE = /\bH-[0-9A-F]{12}\b/i;
const FRIEND_CAMO: readonly CamoStyle[] = ['ink', 'chameleon', 'invisible'];

/** The code of a friend's hunt in some text ("H-3FA9C1D2E4B5"), or null. */
export function parseFriendCode(text: string): string | null {
  return FRIEND_CODE.exec(text)?.[0].toUpperCase() ?? null;
}

export const isFriendChallenge = (c: Challenge | FriendChallenge): c is FriendChallenge => 'kind' in c && c.kind === 'friend';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null);
const within = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

function readFriendObject(v: unknown, knownSprite: (type: string) => boolean): FriendChallengeObject | null {
  if (!isObj(v)) return null;
  const id = typeof v.id === 'string' && /^[a-z0-9-]{1,40}$/.test(v.id) ? v.id : null;
  const name = text(v.name, 80);
  const clue = text(v.clue, 160);
  const type = typeof v.spriteType === 'string' && v.spriteType !== 'seal' && knownSprite(v.spriteType) ? v.spriteType : null;
  const { minX, maxX, minY, maxY } = FRIEND_AREA;
  if (!id || !name || !clue || !type) return null;
  if (!within(v.x, minX, maxX) || !within(v.y, minY, maxY) || !within(v.radius, FRIEND_RADIUS.min, FRIEND_RADIUS.max)) return null;
  if (v.scale !== undefined && !within(v.scale, 0.5, 2)) return null;
  if (v.rotation !== undefined && !within(v.rotation, -180, 180)) return null;
  if (v.flip !== undefined && typeof v.flip !== 'boolean') return null;
  if (v.camo !== undefined && !FRIEND_CAMO.includes(v.camo as CamoStyle)) return null;
  return {
    id,
    spriteType: type as FriendChallengeObject['spriteType'],
    name,
    clue,
    x: v.x as number,
    y: v.y as number,
    radius: v.radius as number,
    ...(v.scale !== undefined ? { scale: v.scale as number } : {}),
    ...(v.rotation !== undefined ? { rotation: v.rotation as number } : {}),
    ...(v.flip !== undefined ? { flip: v.flip as boolean } : {}),
    ...(v.camo !== undefined ? { camo: v.camo as CamoStyle } : {}),
  };
}

/**
 * A friend's hunt as the backend sent it, checked object by object — or null if anything is off
 * (one object that cannot be drawn or found would make the hunt impossible to finish).
 * `knownSprite`: whether this version of the app can draw a sprite type.
 */
export function readFriendChallenge(raw: unknown, knownSprite: (type: string) => boolean): FriendChallenge | null {
  if (!isObj(raw) || !Array.isArray(raw.objects)) return null;
  const { id, code, pageId, contentVersion, title, createdAt } = raw;
  if (typeof id !== 'string' || typeof code !== 'string' || !FRIEND_CODE.test(code) || typeof pageId !== 'string') return null;
  if (typeof contentVersion !== 'number' || typeof title !== 'string' || typeof createdAt !== 'string') return null;
  if (raw.objects.length < 1 || raw.objects.length > FRIEND_MAX_OBJECTS) return null;
  const objects = raw.objects.map((o) => readFriendObject(o, knownSprite));
  if (objects.some((o) => o === null)) return null;
  const ids = objects.map((o) => o!.id);
  if (new Set(ids).size !== ids.length) return null;
  return { kind: 'friend', id, code: code.toUpperCase(), pageId, contentVersion, title: title.trim(), objects: objects as FriendChallengeObject[], createdAt };
}

/** Whether this app can play a friend's hunt, before looking at the page itself. */
export const friendChallengeRefusal = (c: FriendChallenge): ChallengeRefusal | null =>
  c.contentVersion > FRIEND_CONTENT_VERSION ? 'newer' : null;

/** The page played for a friend's hunt: the painting as visited, with only the friend's objects on it. */
export function friendPage(visit: Page, c: FriendChallenge): Page {
  return {
    ...visit,
    title: c.title || visit.title,
    objects: c.objects.map((o) => ({ ...o, score: FRIEND_OBJECT_SCORE })),
    // A layout of its own: the board's caches tell it apart (core/layout.layoutKey)
    layout: `friend-${c.id}`,
  };
}

/** A nonzero layout seed from a random roll in [0, 1). */
export function challengeSeed(roll: number): number {
  return 1 + Math.floor(Math.max(0, Math.min(1 - Number.EPSILON, roll)) * (SEED_COUNT - 1));
}

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
