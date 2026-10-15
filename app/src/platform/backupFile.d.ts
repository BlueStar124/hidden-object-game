import type { ShareOutcome } from './share';

/**
 * Backup files of the save. Two implementations, picked by the bundler per platform:
 * - backupFile.native.ts (iOS/Android): written to the cache and offered to the share sheet
 *   (Files, Drive, a message to oneself…); picked back with the document picker
 * - backupFile.web.ts: downloaded; picked back with the browser's file chooser
 * Never throw.
 */

/** Saves the text of a backup as a file the player keeps. */
export declare function saveBackupFile(text: string, fileName: string): Promise<ShareOutcome>;

/** The text of a backup file the player picks (null: cancelled, or it could not be read). */
export declare function pickBackupFile(): Promise<string | null>;
