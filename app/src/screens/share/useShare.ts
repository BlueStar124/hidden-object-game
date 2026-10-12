import { useCallback, useEffect, useRef, useState } from 'react';
import { shareImage, shareText, type ShareOutcome } from '../../platform/share';
import { drawPostcard, type PostcardContent } from './postcard';

/**
 * Sharing from a dialog: a postcard (picture + message) or a challenge (message). `busy` while the
 * postcard is drawn; `note` tells the player what happened when it was not the share sheet.
 */

// How long the note stays (ms)
const NOTE_MS = 4500;

const NOTES: Partial<Record<ShareOutcome, string>> = {
  copied: 'Đã chép lời nhắn, hãy dán vào tin nhắn gửi bạn bè.',
  downloaded: 'Đã tải bưu thiếp về máy và chép sẵn lời nhắn.',
  failed: 'Không chia sẻ được trên thiết bị này.',
};

export function useShare() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), NOTE_MS);
    return () => clearTimeout(t);
  }, [note]);

  const run = useCallback(async (task: () => Promise<ShareOutcome>) => {
    setBusy(true);
    setNote(null);
    let outcome: ShareOutcome = 'failed';
    try {
      outcome = await task();
    } catch {
      // Sharing is a nicety: whatever happens, the game goes on
    }
    if (!alive.current) return;
    setBusy(false);
    setNote(NOTES[outcome] ?? null);
  }, []);

  const sharePostcard = useCallback(
    (content: PostcardContent, text: string) =>
      run(async () => {
        const jpeg = await drawPostcard(content);
        return jpeg ? shareImage(jpeg, 'buu-thiep-so-ky-hoa.jpg', text) : shareText(text);
      }),
    [run]
  );

  const shareMessage = useCallback((text: string) => run(() => shareText(text)), [run]);

  return { busy, note, sharePostcard, shareMessage };
}
