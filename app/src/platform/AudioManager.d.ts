import type { SpriteType } from '@core/types/level';
import type { audioManager as webAudioManager } from '@core/game/AudioManager';

/**
 * Type surface of the platform twins (AudioManager.native.ts / AudioManager.web.ts).
 * It extends the shared web API, so a method the shared game code starts using fails the
 * typecheck here until both twins implement it.
 */
type SharedAudioApi = { [K in keyof typeof webAudioManager]: (typeof webAudioManager)[K] };

export interface GameAudio extends SharedAudioApi {
  /** Warms up the voices of the creatures & objects on a page (no-op where sounds are live). */
  prepareVoices(types: (SpriteType | undefined)[]): void;
}

export declare const audioManager: GameAudio;
