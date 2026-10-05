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
      clockRuns: !home && !nav.showPrologue && !nav.showNightIntro && !browsing,
      isTurning: nav.turn !== null,
      nextPage: nav.nextPage,
      night: nav.isNight ? undefined : nav.ref.night,
    },
    notify
  );

  // "Chơi tiếp" comes back to the page the player is in — once they have left the home screen for it
  const pageId = nav.page.id;
  useEffect(() => {
    if (!home) progress.recordVisit(pageId);
  }, [home, pageId]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled);
    sound.setSoundEnabled(!soundEnabled);
  }, [soundEnabled]);

  return { nav, case: kase, notices, soundEnabled, toggleSound, home, setHome };
}

export type Game = ReturnType<typeof useGame>;
