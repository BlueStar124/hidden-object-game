import type { SpriteType } from '../core/model';

/**
 * What the game can play. Two implementations, picked by the bundler per platform:
 * - sound.native.ts (iOS/Android): the WAV files rendered from the synth, plus haptics
 * - sound.web.ts: the Web Audio synth itself, live, plus haptics where the browser has them
 */
export interface GameSound {
  setSoundEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  /** Touch feedback for a find; leaves audio to the object's own voice. */
  playFound(combo?: number): void;
  playWrong(): void;
  playHint(): void;
  playPageTurn(): void;
  /** The found creature / object answers with its own little sound. */
  playVoice(type?: SpriteType): void;
  /** The loupe mists over after a burst of random taps */
  playFog(): void;
  playCreature(): void;
  /** A shy creature ducks away just before the tap */
  playRustle(): void;
  playVictory(): void;
  /** Warms up the voices of the creatures & objects on a page (no-op where sounds are live). */
  prepareVoices(types: (SpriteType | undefined)[]): void;
}

export declare const sound: GameSound;
