/**
 * Challenge links on the web: `https://…/?c=SG3-7K2P-142` opens the game on that challenge. Links
 * point at the public address of the game (EXPO_PUBLIC_WEB_URL, inlined at build time) when it is set:
 * a link made on a preview deployment would otherwise ask friends to sign in to Vercel. Without it,
 * the page's own address.
 */

const PARAM = 'c';
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/+$/, '');

/** The challenge code in the address, if any — removed from it, so a reload does not reopen it. */
export function takeLaunchCode(): string | null {
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get(PARAM);
    if (!code) return null;
    url.searchParams.delete(PARAM);
    window.history.replaceState(null, '', url.toString());
    return code;
  } catch {
    return null;
  }
}

/** A link opening a challenge in this web game. */
export function challengeLink(code: string): string | null {
  try {
    return `${WEB_URL ?? window.location.origin}/?${PARAM}=${encodeURIComponent(code)}`;
  } catch {
    return null;
  }
}
