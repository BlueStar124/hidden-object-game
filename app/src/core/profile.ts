/**
 * A player's name in the game (an account's profile): what the home screen greets and a friend's
 * challenge is signed with. Kept in the account's metadata (`display_name`), so every device has it.
 */

/** Length of a name in the game, in characters (after tidying). */
export const NAME_MIN = 2;
export const NAME_MAX = 24;

/** A name as typed, tidied (spaces collapsed, ends trimmed) — or null if it cannot be one. */
export function cleanDisplayName(text: string): string | null {
  // (No control characters: a name ends up in shared messages and on other players' screens)
  const name = text.replace(/\s+/g, ' ').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  const length = [...name].length;
  return length >= NAME_MIN && length <= NAME_MAX ? name : null;
}

/**
 * The name to show for an account: the one the player chose, else what the sign-in provider gives
 * (a Google account's name, cut to fit), else none — the game then asks for one.
 */
export function displayNameOf(meta: Record<string, unknown> | null | undefined): string | null {
  for (const key of ['display_name', 'full_name', 'name']) {
    const value = meta?.[key];
    if (typeof value !== 'string') continue;
    const fitted = [...value.replace(/\s+/g, ' ').trim()].slice(0, NAME_MAX).join('').trim();
    const name = cleanDisplayName(fitted);
    if (name) return name;
  }
  return null;
}

