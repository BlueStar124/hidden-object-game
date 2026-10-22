/**
 * Pure rules and models for the storyline leaderboard.
 * Only daytime storyline pages count toward ranking.
 */

export type LeaderboardScope = 'journey' | 'country' | 'chapter';

export interface LeaderboardFilter {
  scope: LeaderboardScope;
  countryId: string | null;
  chapterNumber: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalScore: number;
  pagesCleared: number;
  totalPages: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: LeaderboardEntry | null;
  error?: string;
}

/** Formats a numerical rank with hashtag prefix, e.g. #1, #42. */
export function formatRank(rank: number): string {
  return `#${Math.max(1, Math.floor(rank))}`;
}

/** Returns the medal tier for top 3 positions. */
export function medalForRank(rank: number): 'gold' | 'silver' | 'bronze' | null {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return null;
}

/** Default leaderboard filter: All journey / All chapters. */
export const DEFAULT_LEADERBOARD_FILTER: LeaderboardFilter = {
  scope: 'journey',
  countryId: null,
  chapterNumber: null,
};

/**
 * Validates a storyline score submission payload before sending to server.
 * Upper bound score 7000 accommodates high combo and time bonus.
 */
export function isPlausibleStoryScore(score: number, stars: number, timeTaken: number): boolean {
  if (typeof score !== 'number' || !Number.isFinite(score) || score <= 0 || score > 7000) {
    return false;
  }
  if (typeof stars !== 'number' || !Number.isFinite(stars) || stars < 1 || stars > 3) {
    return false;
  }
  if (typeof timeTaken !== 'number' || !Number.isFinite(timeTaken) || timeTaken < 0) {
    return false;
  }
  return true;
}

/**
 * Returns a human-readable title describing the active leaderboard scope.
 */
export function describeFilter(
  filter: LeaderboardFilter,
  countryName?: string,
  chapterTitle?: string
): string {
  if (filter.scope === 'journey') {
    return 'Toàn hành trình';
  }
  if (filter.scope === 'country') {
    return countryName ?? 'Quốc gia';
  }
  if (filter.scope === 'chapter') {
    const ch = filter.chapterNumber ? `Chương ${filter.chapterNumber}` : 'Chương';
    return countryName ? `${countryName} · ${ch}` : (chapterTitle ?? ch);
  }
  return 'Bảng xếp hạng';
}

