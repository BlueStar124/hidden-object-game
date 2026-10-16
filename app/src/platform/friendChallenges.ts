import { FRIEND_CONTENT_VERSION, readFriendChallenge, type FriendChallenge, type FriendChallengeObject } from '../core/challenge';
import { SPRITE_ART } from '../generated/spriteArt';
import { supabase } from './supabase';

/** A new id for one publication: retrying it with the same id never makes a second challenge. */
export function newRequestId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return random;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (digit) => {
    const value = Math.floor(Math.random() * 16);
    return (digit === 'x' ? value : (value & 0x3) | 0x8).toString(16);
  });
}

const knownSprite = (type: string) => type in SPRITE_ART;

/** Saves a player-made object layout and returns its stable sharing code. */
export async function publishFriendChallenge(
  requestId: string,
  pageId: string,
  title: string,
  objects: FriendChallengeObject[]
): Promise<string> {
  if (!supabase) throw new Error('Chưa kết nối máy chủ thử thách.');
  const { data, error } = await supabase.rpc('publish_friend_challenge', {
    p_request_id: requestId,
    p_page_id: pageId,
    p_content_version: FRIEND_CONTENT_VERSION,
    p_title: title,
    p_objects: objects,
  });
  if (error) throw error;
  if (typeof data !== 'string' || !/^H-[0-9A-F]{12}$/.test(data)) {
    throw new Error('Máy chủ chưa trả mã thử thách hợp lệ.');
  }
  return data;
}

/** Downloads a shared layout; the server checks sign-in, page history, and revocation. */
export async function getFriendChallenge(code: string): Promise<FriendChallenge> {
  if (!supabase) throw new Error('Chưa kết nối máy chủ thử thách.');
  const { data, error } = await supabase.rpc('get_friend_challenge', { p_code: code });
  if (error) throw error;
  if (!data) throw new Error('Không tìm thấy thử thách này. Hãy kiểm tra lại mã.');
  // Checked object by object (core/challenge): a hunt this app cannot draw is refused, not played
  const challenge = readFriendChallenge(data, knownSprite);
  if (!challenge) throw new Error('Thử thách này dùng nội dung mà bản game của bạn chưa có. Hãy cập nhật game rồi thử lại.');
  return challenge;
}
