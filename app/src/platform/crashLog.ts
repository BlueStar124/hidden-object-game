import { Platform } from 'react-native';

/**
 * The last errors the game ran into, kept on the device. There is no server to send them to:
 * the crash screen shows them and lets the player pass a report on (see screens/ErrorBoundary).
 * Stored apart from the progress, under its own key, so a damaged log never touches a save.
 */

const STORAGE_KEY = 'detective_sketchbook_crashes_v1';
// Only the latest few matter, and storage is shared with the save
const MAX_ENTRIES = 10;
const MAX_STACK = 2000; // characters

export interface CrashEntry {
  at: string; // ISO date
  where: 'render' | 'global' | 'promise';
  message: string;
  stack?: string;
  platform: string;
}

function read(): CrashEntry[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(data) ? data.filter((e) => typeof e?.message === 'string') : [];
  } catch {
    return [];
  }
}

function describe(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: `${error.name}: ${error.message}`, stack: error.stack?.slice(0, MAX_STACK) };
  try {
    return { message: String(error) };
  } catch {
    return { message: 'Unknown error' };
  }
}

export const crashLog = {
  /** Keeps an error for the crash screen; never throws, whatever the error or the storage. */
  record(error: unknown, where: CrashEntry['where'], extraStack?: string): void {
    try {
      const { message, stack } = describe(error);
      const entry: CrashEntry = {
        at: new Date().toISOString(),
        where,
        message,
        stack: [stack, extraStack].filter(Boolean).join('\n').slice(0, MAX_STACK) || undefined,
        platform: `${Platform.OS} ${String(Platform.Version ?? '')}`.trim(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...read()].slice(0, MAX_ENTRIES)));
    } catch {
      // Logging must never be the reason the game fails
    }
  },

  /** Newest first. */
  entries(): CrashEntry[] {
    return read();
  },

  /** A plain-text report of the latest errors, for the player to send. */
  report(): string {
    return read()
      .slice(0, 3)
      .map((e) => [`[${e.at}] ${e.where} · ${e.platform}`, e.message, e.stack].filter(Boolean).join('\n'))
      .join('\n\n');
  },
};

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;

let installed = false;

/** Records errors no component caught: uncaught exceptions and rejected promises. */
export function installCrashLog(): void {
  if (installed) return;
  installed = true;
  try {
    const errorUtils = (globalThis as { ErrorUtils?: { getGlobalHandler(): GlobalHandler; setGlobalHandler(h: GlobalHandler): void } })
      .ErrorUtils;
    if (errorUtils) {
      // iOS/Android: keep React Native's own handler (red box in development, the crash itself in release)
      const previous = errorUtils.getGlobalHandler();
      errorUtils.setGlobalHandler((error, isFatal) => {
        crashLog.record(error, 'global');
        previous(error, isFatal);
      });
    } else if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('error', (e) => crashLog.record(e.error ?? e.message, 'global'));
      window.addEventListener('unhandledrejection', (e) => crashLog.record(e.reason, 'promise'));
    }
  } catch {
    // Without a handler the game still runs; it only forgets its errors
  }
}
