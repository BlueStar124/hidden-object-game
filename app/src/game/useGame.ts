import { useCallback, useState } from 'react';
import { sound } from '../platform/sound';
import { useCase } from './useCase';
import { useNavigation } from './useNavigation';
import { useNotices } from './useNotices';

/**
 * A play session: where the player is in the books (useNavigation), the case of the page being
 * played (useCase), and the notices floating up from the page (useNotices).
 * `browsing`: the page index or the album covers the sketchbook — the clock waits meanwhile.
 */
export function useGame({ browsing }: { browsing: boolean }) {
  const nav = useNavigation();
  const { notices, notify } = useNotices();
  const kase = useCase(
    nav.page,
    nav.visit,
    {
      clockRuns: !nav.showPrologue && !nav.showNightIntro && !browsing,
      isTurning: nav.turn !== null,
      nextPage: nav.nextPage,
      night: nav.isNight ? undefined : nav.ref.night,
    },
    notify
  );

  const [soundEnabled, setSoundEnabled] = useState(true);
  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled);
    sound.setSoundEnabled(!soundEnabled);
  }, [soundEnabled]);

  return { nav, case: kase, notices, soundEnabled, toggleSound };
}

export type Game = ReturnType<typeof useGame>;
