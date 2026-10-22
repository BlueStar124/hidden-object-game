import { describe, expect, jest, test } from '@jest/globals';
import {
  DEFAULT_LEADERBOARD_FILTER,
  describeFilter,
  formatRank,
  isPlausibleStoryScore,
  medalForRank,
} from '../src/core/leaderboard';

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
    expect(isPlausibleStoryScore(1500, 3, 45)).toBe(true);
    expect(isPlausibleStoryScore(0, 1, 10)).toBe(false);
    expect(isPlausibleStoryScore(-100, 1, 10)).toBe(false);
    expect(isPlausibleStoryScore(10000, 3, 10)).toBe(false);
    expect(isPlausibleStoryScore(2000, 0, 10)).toBe(false);
    expect(isPlausibleStoryScore(2000, 4, 10)).toBe(false);
    expect(isPlausibleStoryScore(2000, 2, -5)).toBe(false);
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

describe('LeaderboardView out-of-order race condition protection', () => {
  test('when filter A -> B is requested, but B resolves before A, display remains B', async () => {
    const React = require('react');
    const { act, create } = require('react-test-renderer');
    const { LeaderboardView } = require('../src/screens/home/LeaderboardView');
    const { FilterPickerModal } = require('../src/screens/home/leaderboard/FilterPickerModal');
    const { LeaderboardItemRow } = require('../src/screens/home/leaderboard/LeaderboardItemRow');

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
  });
});

