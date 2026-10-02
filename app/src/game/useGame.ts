import { useCallback, useState } from 'react';
import { sound } from '../platform/sound';
import { useCase } from './useCase';
import { useNavigation } from './useNavigation';
import { useNotices } from './useNotices';

/**
 * A play session: where the player is in the books (useNavigation), the case of the page being
 * played (useCase), and the notices floating up from the page (useNotices).
 */
export function useGame() {
  const nav = useNavigation();
  const { notices, notify } = useNotices();
  const kase = useCase(
    nav.page,
    nav.visit,
    {
      clockRuns: !nav.showPrologue && !nav.showNightIntro,
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
