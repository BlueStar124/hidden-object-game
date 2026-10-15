/**
 * Passing something on to other apps: a challenge as text, a postcard as a picture. Two
 * implementations, picked by the bundler per platform:
 * - share.native.ts (iOS/Android): the system share sheet (a picture goes through a cache file)
 * - share.web.ts: the Web Share API where the browser has it, otherwise copy / download
 * Never throws: the outcome says what happened, for the player to be told.
 */

/** What became of a share. */
export type ShareOutcome = 'shared' | 'copied' | 'downloaded' | 'cancelled' | 'failed';

export declare function shareText(text: string): Promise<ShareOutcome>;

/** A JPEG picture (base64), with `text` beside it where the platform can carry both. */
export declare function shareImage(jpegBase64: string, fileName: string, text: string): Promise<ShareOutcome>;
