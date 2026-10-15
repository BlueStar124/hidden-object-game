import { mergeProgress, progress, readBackup } from '../core/progress';
import { saveOwner, setSaveOwner } from './accountPrefs';
import { supabase } from './supabase';

const CLOUD_SAVE_GAME = 'the-lost-sketchbook';
const SAVE_DELAY_MS = 700; // a burst of finds is uploaded once
const REQUEST_TIMEOUT_MS = 8000; // a weak network gives up rather than hanging
const RETRY_MS = 30_000; // after a failed sync, try again

/** A signed-in player's save mirrored to their account. */
export interface CloudSync {
  /** Settles (never rejects) after the first sync, done or failed */
  ready: Promise<void>;
  /** Uploads what is pending now (before signing out) */
  flush: () => Promise<void>;
  stop: () => void;
}

/** A request, failing after REQUEST_TIMEOUT_MS. */
function timed<T>(request: PromiseLike<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), REQUEST_TIMEOUT_MS);
    Promise.resolve(request).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Syncs the device's save with the account's: each sync reads the cloud copy, merges it
 * (core/progress.mergeProgress: nothing of either is lost), then writes the merge back — so two
 * devices never overwrite each other. A guest's progress joins the first account that signs in;
 * another account's progress on the device is set aside for this account's own.
 */
export function connectCloudProgress(userId: string): CloudSync {
  const client = supabase;
  if (!client) return { ready: Promise.resolve(), flush: async () => {}, stop: () => {} };

  let stopped = false;
  let applying = false; // a save written by the sync itself is not a change to upload
  let delay: ReturnType<typeof setTimeout> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let chain = Promise.resolve();
  const visited = new Set<string>();

  const syncOnce = async () => {
    const { data, error } = await timed(client.from('user_progress').select('save_data').eq('user_id', userId).maybeSingle());
    if (error) throw error;
    if (stopped) return;
    const cloudText = data?.save_data ? JSON.stringify({ game: CLOUD_SAVE_GAME, save: data.save_data }) : null;

    applying = true;
    try {
      const owner = saveOwner();
      if (owner !== userId) {
        if (owner !== null) progress.replace(cloudText);
        setSaveOwner(userId);
      }
      if (cloudText) progress.restore(cloudText);
    } finally {
      applying = false;
    }

    const local = readBackup(progress.backup());
    if (!local) return;
    const cloud = cloudText ? readBackup(cloudText) : null;
    const { error: saveError } = await timed(
      client
        .from('user_progress')
        .upsert({ user_id: userId, save_data: cloud ? mergeProgress(local, cloud) : local, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    );
    if (saveError) throw saveError;

    // Pages played, for the server's challenge rules: one at a time, never all at once
    for (const pageId of progress.playedPages()) {
      if (stopped) return;
      if (visited.has(pageId)) continue;
      const { error: visitError } = await timed(client.rpc('record_page_visit', { p_page_id: pageId }));
      if (visitError) throw visitError;
      visited.add(pageId);
    }
  };

  const sync = (): Promise<void> => {
    if (retry) clearTimeout(retry);
    chain = chain.then(syncOnce).catch(() => {
      // The device copy stays authoritative while offline: try again later
      if (!stopped) retry = setTimeout(() => void sync(), RETRY_MS);
    });
    return chain;
  };

  const unsubscribe = progress.subscribe(() => {
    if (applying || stopped) return;
    if (delay) clearTimeout(delay);
    delay = setTimeout(() => void sync(), SAVE_DELAY_MS);
  });

  return {
    ready: sync(),
    flush: () => {
      if (delay) clearTimeout(delay);
      return sync();
    },
    stop: () => {
      stopped = true;
      unsubscribe();
      if (delay) clearTimeout(delay);
      if (retry) clearTimeout(retry);
    },
  };
}
