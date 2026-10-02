import type { SpriteType } from '../core/model';
import { haptics } from './haptics';
import type { GameSound } from './sound';
import { synth } from './synth/synth';

/** Web: the Web Audio synth plays live (instant, nothing to download), with haptics where supported. */
export const sound: GameSound = {
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
