import { beforeEach, describe, expect, test } from '@jest/globals';
import { crashLog } from '../src/platform/crashLog';

const KEY = 'detective_sketchbook_crashes_v1';
let items: Map<string, string>;
let failWrites: boolean;

beforeEach(() => {
  items = new Map();
  failWrites = false;
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => items.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (failWrites) throw new Error('QuotaExceededError');
        items.set(k, v);
      },
    },
    configurable: true,
  });
});

describe('the crash log', () => {
  test('keeps the latest errors, newest first, and makes a report of them', () => {
    for (let i = 0; i < 12; i++) crashLog.record(new Error(`boom ${i}`), 'render');
    const entries = crashLog.entries();
    expect(entries).toHaveLength(10);
    expect(entries[0].message).toBe('Error: boom 11');
    expect(crashLog.report()).toContain('Error: boom 11');
  });

  test('anything thrown can be recorded, not only errors', () => {
    crashLog.record('plain text', 'promise');
    expect(crashLog.entries()[0]).toMatchObject({ where: 'promise', message: 'plain text' });
  });

  test('a damaged log or a full storage never throws', () => {
    items.set(KEY, '{ bad json');
    expect(crashLog.entries()).toEqual([]);
    failWrites = true;
    expect(() => crashLog.record(new Error('boom'), 'global')).not.toThrow();
  });
});
