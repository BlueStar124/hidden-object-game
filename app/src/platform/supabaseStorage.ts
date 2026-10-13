import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CHUNK_CODE_POINTS = 450; // At most 1,800 UTF-8 bytes per SecureStore entry.
const COUNT_SUFFIX = '__parts';

/** Stores auth sessions securely on native, with chunking for SecureStore's small-value limit. */
export const supabaseStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }

    const countText = await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`);
    const count = Number(countText);
    if (!Number.isInteger(count) || count < 1) return SecureStore.getItemAsync(key);

    const parts = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(`${key}__${index}`))
    );
    return parts.some((part) => part === null) ? null : parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        // Auth persistence is best-effort when browser storage is unavailable.
      }
      return;
    }

    const characters = Array.from(value);
    const parts = Array.from({ length: Math.max(1, Math.ceil(characters.length / CHUNK_CODE_POINTS)) }, (_, index) =>
      characters.slice(index * CHUNK_CODE_POINTS, (index + 1) * CHUNK_CODE_POINTS).join('')
    );
    const previousCount = Number(await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`)) || 0;
    await Promise.all(parts.map((part, index) => SecureStore.setItemAsync(`${key}__${index}`, part)));
    await SecureStore.setItemAsync(`${key}${COUNT_SUFFIX}`, String(parts.length));
    await SecureStore.deleteItemAsync(key);
    await Promise.all(
      Array.from({ length: Math.max(0, previousCount - parts.length) }, (_, index) =>
        SecureStore.deleteItemAsync(`${key}__${parts.length + index}`)
      )
    );
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        // Auth persistence is best-effort when browser storage is unavailable.
      }
      return;
    }

    const count = Number(await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`)) || 0;
    await Promise.all([
      SecureStore.deleteItemAsync(key),
      SecureStore.deleteItemAsync(`${key}${COUNT_SUFFIX}`),
      ...Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(`${key}__${index}`)),
    ]);
  },
};
