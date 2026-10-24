import { describe, expect, jest, test } from '@jest/globals';
import {
  DEFAULT_LEADERBOARD_FILTER,
  describeFilter,
  formatRank,
  isPlausibleStoryScore,
  maxPageScore,
  medalForRank,
} from '../src/core/leaderboard';
import fs from 'node:fs';
import path from 'node:path';
import { COUNTRIES, pagesOf } from '../src/content';
import { MIGRANTS } from '../src/content/migrants';
import { MIGRANT_SCORE } from '../src/core/migrants';
import { foundScore } from '../src/core/scoring';
// Imported at the top (jest.mock below is hoisted above these): loading the screen and every page's
// JSON inside the test body ran past the 5 s timeout when the whole suite shares the CPU
import React from 'react';
import { act, create } from 'react-test-renderer';
import { LeaderboardView } from '../src/screens/home/LeaderboardView';

describe('leaderboard core rules', () => {
  test('default filter starts at journey scope', () => {
    expect(DEFAULT_LEADERBOARD_FILTER.scope).toBe('journey');
    expect(DEFAULT_LEADERBOARD_FILTER.countryId).toBeNull();
    expect(DEFAULT_LEADERBOARD_FILTER.chapterNumber).toBeNull();
  });

  test('formatRank prefixes hash symbol correctly', () => {
    expect(formatRank(1)).toBe('#1');
    expect(formatRank(42)).toBe('#42');
    expect(formatRank(137)).toBe('#137');
  });

  test('medal tiers for top 3', () => {
    expect(medalForRank(1)).toBe('gold');
    expect(medalForRank(2)).toBe('silver');
    expect(medalForRank(3)).toBe('bronze');
    expect(medalForRank(4)).toBeNull();
    expect(medalForRank(100)).toBeNull();
  });

  test('isPlausibleStoryScore rejects out-of-range scores and times', () => {
    expect(isPlausibleStoryScore(1500, 3, 45, 9000)).toBe(true);
    expect(isPlausibleStoryScore(9000, 3, 45, 9000)).toBe(true);
    expect(isPlausibleStoryScore(9001, 3, 45, 9000)).toBe(false);
    expect(isPlausibleStoryScore(0, 1, 10, 9000)).toBe(false);
    expect(isPlausibleStoryScore(-100, 1, 10, 9000)).toBe(false);
    expect(isPlausibleStoryScore(2000, 0, 10, 9000)).toBe(false);
    expect(isPlausibleStoryScore(2000, 4, 10, 9000)).toBe(false);
    expect(isPlausibleStoryScore(2000, 2, -5, 9000)).toBe(false);
  });

  test('maxPageScore is one unbroken combo, smallest find first, plus the whole clock', () => {
    // ×1: 100; ×2: 2·150 + 50; ×3: 3·200 + 100; then 60 s × 4
    expect(maxPageScore([200, 100, 150], 60)).toBe(100 + 350 + 700 + 240);
    // No other order scores more
    const orders = [[100, 150, 200], [200, 150, 100], [150, 100, 200]];
    for (const o of orders) {
      const total = o.reduce((sum, s, i) => sum + foundScore(s, i + 1, 0).earnedScore, 0) + 240;
      expect(total).toBeLessThanOrEqual(maxPageScore(o, 60));
    }
  });

  test('describeFilter formats labels accurately', () => {
    expect(describeFilter({ scope: 'journey', countryId: null, chapterNumber: null })).toBe('Toàn hành trình');
    expect(describeFilter({ scope: 'country', countryId: 'singapore', chapterNumber: null }, 'Singapore')).toBe('Singapore');
    expect(
      describeFilter({ scope: 'chapter', countryId: 'vietnam', chapterNumber: 2 }, 'Việt Nam', 'Miền Cao Tây Bắc')
    ).toBe('Việt Nam · Chương 2');
  });
});

jest.mock('../src/ui/icons', () => {
  const React = require('react');
  const dummy = () => React.createElement('Icon');
  return new Proxy({}, { get: () => dummy });
});

let mockResolveReqA: (value: any) => void;
let mockResolveReqB: (value: any) => void;
const mockCalls: any[] = [];

jest.mock('../src/platform/leaderboard', () => ({
  fetchLeaderboard: jest.fn((filter: any) => {
    mockCalls.push(filter);
    if (mockCalls.length === 1) {
      return new Promise((res) => {
        mockResolveReqA = res;
      });
    }
    if (mockCalls.length === 2) {
      return new Promise((res) => {
        mockResolveReqB = res;
      });
    }
    return Promise.resolve({ entries: [], userRank: null });
  }),
}));

describe('the storyline catalog on the server (supabase/migrations)', () => {
  // Latest values per page across the migrations, in order: (id, country, chapter, page[, max_score])
  const catalog = new Map<string, { country: string; chapter: number; page: number; max?: number }>();
  const dir = path.join(__dirname, '..', '..', 'supabase', 'migrations');
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) {
    const sql = fs.readFileSync(path.join(dir, name), 'utf8');
    for (const m of sql.matchAll(/\('([a-z0-9-]+)', '([a-z]+)', (\d+), (\d+)(?:, (\d+))?\)/g)) {
      catalog.set(m[1], { country: m[2], chapter: +m[3], page: +m[4], max: m[5] ? +m[5] : catalog.get(m[1])?.max });
    }
  }

  test('lists every day page with its country, chapter and number in book order', () => {
    const books = COUNTRIES.flatMap((c) => pagesOf(c).map((r) => [r.day.id, { country: c.id, chapter: r.chapterNumber, page: r.number }] as const));
    expect([...catalog.keys()].sort()).toEqual(books.map(([id]) => id).sort());
    for (const [id, place] of books) expect({ id, ...catalog.get(id), max: undefined }).toEqual({ id, ...place, max: undefined });
  });

  test('the max_score of each page covers a perfect run with every migrant that can visit it', () => {
    for (const c of COUNTRIES) {
      for (const r of pagesOf(c)) {
        const visitors = MIGRANTS.filter((m) => m.spots.some((s) => s.pageId === r.day.id)).map(() => MIGRANT_SCORE);
        const best = maxPageScore([...r.day.objects.map((o) => o.score), ...visitors], r.day.timeLimit);
        expect({ id: r.day.id, max: catalog.get(r.day.id)?.max }).toEqual({ id: r.day.id, max: best });
      }
    }
  });
});

describe('LeaderboardView out-of-order race condition protection', () => {
  test('when filter A -> B is requested, but B resolves before A, display remains B', async () => {

    let renderer: any;
    act(() => {
      renderer = create(React.createElement(LeaderboardView, { currentUserId: 'user-me' }));
    });

    expect(mockCalls.length).toBe(1);
    expect(mockCalls[0].scope).toBe('journey');

    // User switches filter to Vietnam (Request B)
    act(() => {
      const picker = renderer.root.find((node: any) => typeof node.props.onSelectCountry === 'function');
      picker.props.onSelectCountry('vietnam');
    });

    expect(mockCalls.length).toBe(2);
    expect(mockCalls[1].countryId).toBe('vietnam');

    // Simulate Network response B returning BEFORE response A
    await act(async () => {
      mockResolveReqB({
        entries: [
          { rank: 1, userId: 'user-b', displayName: 'Thám Tử B (Việt Nam)', totalScore: 9500, pagesCleared: 5, totalPages: 5 },
        ],
        userRank: null,
      });
    });

    // Verify screen displays B
    let rows = renderer.root.findAll((node: any) => node.props.entry?.displayName);
    expect(rows.length).toBe(1);
    expect(rows[0].props.entry.displayName).toBe('Thám Tử B (Việt Nam)');

    // Now delayed response A finally arrives
    await act(async () => {
      mockResolveReqA({
        entries: [
          { rank: 1, userId: 'user-a', displayName: 'Thám Tử A (Toàn hành trình)', totalScore: 18000, pagesCleared: 37, totalPages: 37 },
        ],
        userRank: null,
      });
    });

    // Screen MUST STILL display B, discarding outdated response A
    rows = renderer.root.findAll((node: any) => node.props.entry?.displayName);
    expect(rows.length).toBe(1);
    expect(rows[0].props.entry.displayName).toBe('Thám Tử B (Việt Nam)');

    // Invalidate and unmount safely with pending request
    await act(async () => {
      renderer.unmount();
    });
    // The first render of a whole screen can pass 5 s when the full suite shares the CPU
  }, 20000);
});

