import type { SpriteType } from '@core/types/level';
import { audioManager as synth } from '@core/game/AudioManager';
import type { GameAudio } from './AudioManager';
import { haptics } from './haptics';

/**
 * Web twin of the shared AudioManager: the browser keeps the original Web Audio synth
 * (instant, nothing to download) and adds haptics where the browser supports them.
 */
export const audioManager: GameAudio = {
  setSoundEnabled: (enabled: boolean) => synth.setSoundEnabled(enabled),
  isEnabled: () => synth.isEnabled(),
  playFound: (combo: number = 1) => {
    haptics.found(combo);
    synth.playFound(combo);
  },
  playWrong: () => {
    haptics.wrong();
    synth.playWrong();
  },
  playHint: () => {
    haptics.hint();
    synth.playHint();
  },
  playPageTurn: () => {
    haptics.pageTurn();
    synth.playPageTurn();
  },
  playVoice: (type?: SpriteType) => synth.playVoice(type),
  playFog: () => {
    haptics.fog();
    synth.playFog();
  },
  playCreature: () => synth.playCreature(),
  playRustle: () => {
    haptics.rustle();
    synth.playRustle();
  },
  playVictory: () => {
    haptics.victory();
    synth.playVictory();
  },
  // Voices are synthesised on the fly here
  prepareVoices: () => {},
};
