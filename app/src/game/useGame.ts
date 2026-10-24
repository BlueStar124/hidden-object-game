import { useCallback, useEffect, useState } from 'react';
import { progress } from '../core/progress';
import { sound } from '../platform/sound';
import { useCase } from './useCase';
import { useNavigation } from './useNavigation';
import { useNotices } from './useNotices';

/**
 * A play session: where the player is in the books (useNavigation), the case of the page being
 * played (useCase), and the notices floating up from the page (useNotices).
 * `browsing`: the page index or the album covers the sketchbook — the clock waits meanwhile.
 * The home screen covers it too when the app opens (and from the pause menu).
 */
export function useGame({ browsing }: { browsing: boolean }) {
  const nav = useNavigation();
  const { notices, notify } = useNotices();
  const [home, setHome] = useState(true);
  const kase = useCase(
    nav.page,
    nav.visit,
    {
      clockRuns: !home && !nav.turn && !nav.showPrologue && !nav.showNightIntro && !browsing,
      isTurning: nav.turn !== null,
      nextPage: nav.nextPage,
      night: nav.isNight ? undefined : nav.ref.night,
      mode: nav.mode,
      isNight: nav.isNight,
    },
    notify
  );

  // "Chơi tiếp" comes back to the page the player is in — once they have left the home screen for it
  // (a page of the book: a daily page or a challenge is a hunt beside it)
  const pageId = nav.page.id;
  const inBook = nav.mode.kind === 'book';
  const readyToPlay = !nav.turn && !nav.showPrologue && !nav.showNightIntro && !browsing;
  useEffect(() => {
    if (!home && inBook && readyToPlay) progress.recordVisit(pageId);
  }, [home, pageId, inBook, readyToPlay]);

  // The sound switch is saved: a player who muted the game finds it muted next time
  const [soundEnabled, setSoundEnabled] = useState(() => progress.soundEnabled());
  useEffect(() => {
    sound.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);
  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled);
    progress.setSoundEnabled(!soundEnabled);
  }, [soundEnabled]);

  return { nav, case: kase, notices, soundEnabled, toggleSound, home, setHome };
}

export type Game = ReturnType<typeof useGame>;
