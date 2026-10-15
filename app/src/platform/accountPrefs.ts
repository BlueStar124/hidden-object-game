/**
 * What the device remembers about accounts, beside the save itself (localStorage; iOS/Android:
 * SQLite-backed, installed in index.ts). Never throws: storage may be unavailable.
 */

const OWNER_KEY = 'detective_sketchbook_account';
const ENTERED_KEY = 'detective_sketchbook_entered';

function read(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Remembered next time instead
  }
}

/** The account whose progress the device's save holds (null: a guest's, never synced). */
export const saveOwner = (): string | null => read(OWNER_KEY);
export const setSaveOwner = (userId: string) => write(OWNER_KEY, userId);

/** The player has been in the game before (as a guest or signed in): later launches go straight in. */
export const hasEntered = (): boolean => read(ENTERED_KEY) === '1';
export const rememberEntered = () => write(ENTERED_KEY, '1');
