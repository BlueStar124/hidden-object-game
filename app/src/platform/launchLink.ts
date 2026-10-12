/**
 * Challenge links. iOS/Android: the app is not opened by links (yet); a shared challenge carries a
 * link to the web game when its address is set (EXPO_PUBLIC_WEB_URL, inlined at build time).
 */

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/+$/, '');

/** The challenge code the game was opened with, if any (once: it is consumed). */
export function takeLaunchCode(): string | null {
  return null;
}

/** A link opening a challenge in the web game (null: no known address). */
export function challengeLink(code: string): string | null {
  return WEB_URL ? `${WEB_URL}/?c=${encodeURIComponent(code)}` : null;
}
