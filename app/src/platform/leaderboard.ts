import {
  isPlausibleStoryScore,
  type LeaderboardData,
  type LeaderboardEntry,
  type LeaderboardFilter,
} from '../core/leaderboard';
import { cleanDisplayName } from '../core/profile';
import { supabase } from './supabase';

const TIMEOUT_MS = 8000;

function timed<T>(promise: PromiseLike<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
    Promise.resolve(promise).then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function parseEntry(raw: unknown): LeaderboardEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const rank = typeof obj.rank === 'number' ? obj.rank : 0;
  const userId = typeof obj.userId === 'string' ? obj.userId : '';
  const displayName = typeof obj.displayName === 'string' && obj.displayName ? obj.displayName : 'Thám tử ẩn danh';
  const totalScore = typeof obj.totalScore === 'number' ? obj.totalScore : 0;
  const pagesCleared = typeof obj.pagesCleared === 'number' ? obj.pagesCleared : 0;
  const totalPages = typeof obj.totalPages === 'number' ? obj.totalPages : 0;

  if (rank <= 0 || !userId) return null;
  return {
    rank,
    userId,
    displayName,
    totalScore,
    pagesCleared,
    totalPages,
  };
}

/**
 * Fetches the top 100 entries and the current user's individual rank for the specified scope.
 * Never throws — returns a graceful offline/error fallback if connection fails.
 */
export async function fetchLeaderboard(
  filter: LeaderboardFilter,
  currentUserId?: string | null
): Promise<LeaderboardData> {
  const client = supabase;
  if (!client) {
    return {
      entries: [],
      userRank: null,
      error: 'Máy chủ xếp hạng chưa được cấu hình. Bạn vẫn có thể chơi ngoại tuyến.',
    };
  }

  try {
    const rpcParams = {
      p_scope: filter.scope,
      p_country_id: filter.countryId ?? null,
      p_chapter_number: filter.chapterNumber ?? null,
      p_limit: 100,
    };

    const boardPromise = timed(client.rpc('get_leaderboard', rpcParams));

    const userRankPromise =
      currentUserId && typeof currentUserId === 'string'
        ? timed(
            client.rpc('get_user_leaderboard_rank', {
              p_user_id: currentUserId,
              p_scope: filter.scope,
              p_country_id: filter.countryId ?? null,
              p_chapter_number: filter.chapterNumber ?? null,
            })
          )
        : Promise.resolve({ data: null, error: null });

    const [boardRes, userRankRes] = await Promise.all([boardPromise, userRankPromise]);

    if (boardRes.error) {
      console.warn('Leaderboard fetch error:', boardRes.error);
      const isMissingRpc = (boardRes.error as { code?: string })?.code === 'PGRST202';
      return {
        entries: [],
        userRank: null,
        error: isMissingRpc
          ? 'Máy chủ Supabase chưa áp dụng migration (20261018230000_story_leaderboard.sql). Hãy chạy file này trong Supabase SQL Editor.'
          : 'Không thể kết nối máy chủ xếp hạng · Bạn vẫn có thể chơi ngoại tuyến',
      };
    }

    const rawList = Array.isArray(boardRes.data) ? boardRes.data : [];
    const entries: LeaderboardEntry[] = [];
    for (const item of rawList) {
      const parsed = parseEntry(item);
      if (parsed) entries.push(parsed);
    }

    let userRank: LeaderboardEntry | null = null;
    if (userRankRes.data) {
      userRank = parseEntry(userRankRes.data);
    }

    return { entries, userRank };
  } catch (err) {
    console.warn('Leaderboard network/timeout error:', err);
    return {
      entries: [],
      userRank: null,
      error: 'Không thể kết nối máy chủ xếp hạng · Bạn vẫn có thể chơi ngoại tuyến',
    };
  }
}

/**
 * Submits a completed daytime storyline page score to the Supabase leaderboard.
 * Only authenticated users can submit. Safe to call fire-and-forget in background.
 */
export async function submitStoryScore(
  pageId: string,
  score: number,
  stars: number,
  timeTaken: number,
  displayName?: string | null
): Promise<boolean> {
  if (!isPlausibleStoryScore(score, stars, timeTaken)) {
    return false;
  }

  const client = supabase;
  if (!client) return false;

  try {
    const { data: sessionData } = await client.auth.getSession();
    const session = sessionData?.session;
    if (!session || !session.user) {
      // Guest play is not submitted to online leaderboard
      return false;
    }

    const cleanedName = displayName ? cleanDisplayName(displayName) : null;
    const { error } = await timed(
      client.rpc('record_story_score', {
        p_page_id: pageId,
        p_score: score,
        p_stars: stars,
        p_time: timeTaken,
        p_display_name: cleanedName ?? null,
      })
    );

    if (error) {
      console.warn('Failed to record story score:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Submit story score error:', err);
    return false;
  }
}

