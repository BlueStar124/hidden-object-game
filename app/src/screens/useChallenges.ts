import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  isFriendChallenge,
  parseChallenge,
  parseFriendCode,
  type Challenge,
  type ChallengeRefusal,
  type FriendChallenge,
} from '../core/challenge';
import type { Page } from '../core/model';
import type { Navigation } from '../game/useNavigation';
import { getFriendChallenge } from '../platform/friendChallenges';
import { takeLaunchCode } from '../platform/launchLink';
import { challengeMessage, friendSolvedMessage } from './share/messages';

/** A code to show in the challenge sheet, with why it could not be played. */
export interface ChallengeDraft {
  text: string;
  error: string | null;
}

/** What the player reads when a hunt cannot be played. */
function refusalText(refusal: ChallengeRefusal): string {
  switch (refusal) {
    case 'missing':
      return 'Mã này dành cho một trang chưa có trong phiên bản game của bạn.';
    case 'newer':
      return 'Thử thách này dùng nội dung mới hơn bản game của bạn. Hãy cập nhật game rồi thử lại.';
    case 'turning':
      return 'Đang lật trang. Hãy thử lại khi trang đã mở.';
  }
}

/**
 * Challenges from the home screen and from links: opening a code or a friend's hunt (the rules —
 * page played, content version — are core/challenge's, applied by useNavigation), the sheet's draft
 * when it cannot be played, and the message to share once a hunt is solved.
 */
export function useChallenges(options: {
  nav: Navigation;
  page: Page;
  completed: boolean;
  timeTaken: number;
  signedIn: boolean;
  /** A hunt opened: close what is over the board */
  onOpened: () => void;
  /** Show the challenge sheet */
  showSheet: () => void;
}) {
  const { nav, page, completed, timeTaken, signedIn, onOpened, showSheet } = options;
  const { openChallenge, openFriendChallenge, mode, seed } = nav;
  const [draft, setDraft] = useState<ChallengeDraft | null>(null);

  const enter = useCallback(() => {
    setDraft(null);
    showSheet();
  }, [showSheet]);

  const play = useCallback(
    (challenge: Challenge) => {
      const refused = openChallenge(challenge);
      if (refused) return refusalText(refused);
      onOpened();
      return null;
    },
    [openChallenge, onOpened]
  );

  const playFriend = useCallback(
    (challenge: FriendChallenge) => {
      const refused = openFriendChallenge(challenge);
      if (refused) return refusalText(refused);
      onOpened();
      return null;
    },
    [openFriendChallenge, onOpened]
  );

  // Opened from a challenge link (web): straight into that hunt — a code, or a friend's hunt to fetch
  const launched = useRef(false);
  useEffect(() => {
    if (launched.current) return;
    launched.current = true;
    const code = takeLaunchCode();
    if (!code) return;
    const failed = (error: string | null) => {
      if (!error) return;
      setDraft({ text: code, error });
      showSheet();
    };
    const friendCode = parseFriendCode(code);
    if (friendCode) {
      if (!signedIn) return failed('Đăng nhập để nhận thử thách từ bạn bè.');
      getFriendChallenge(friendCode)
        .then((challenge) => failed(playFriend(challenge)))
        .catch(() => failed('Không thể nhận mã này. Hãy kiểm tra mã và kết nối mạng.'));
      return;
    }
    const challenge = parseChallenge(code);
    failed(challenge ? play(challenge) : 'Mã thử thách trong đường dẫn chưa đúng.');
  }, [play, playFriend, signedIn, showSheet]);

  const solved = useMemo(() => {
    if (!completed || mode.kind === 'daily') return null;
    if (mode.kind === 'challenge' && isFriendChallenge(mode.challenge)) {
      return { code: mode.challenge.code, text: friendSolvedMessage(mode.challenge.code, mode.challenge.title) };
    }
    return challengeMessage(page, seed, timeTaken);
  }, [completed, mode, page, seed, timeTaken]);

  return { draft, enter, play, playFriend, solved };
}
