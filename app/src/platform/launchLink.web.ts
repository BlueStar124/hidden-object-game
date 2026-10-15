/**
 * Challenge links on the web: `https://…/?c=SG3-7K2P-142` opens the game on that challenge. The
 * address is the page's own, so a link works wherever the game is hosted.
 */

const PARAM = 'c';

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
    return `${window.location.origin}/?${PARAM}=${encodeURIComponent(code)}`;
  } catch {
    return null;
  }
}
