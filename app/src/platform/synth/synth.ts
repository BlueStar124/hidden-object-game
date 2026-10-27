import type { SpriteType } from '../../core/model';
import { playCreatureVoice } from './voices';
import {
  synthCreature,
  synthFog,
  synthFound,
  synthHint,
  synthPageTurn,
  synthRustle,
  synthVictory,
  synthWrong,
} from './synthSounds';

/**
 * Every sound of the game, synthesized with the Web Audio API — the single source of the sound
 * design. The web build plays it live (sound.web.ts); for iOS/Android, tools/generate-assets
 * renders it offline to WAV files (sound.native.ts plays those).
 */
class WebAudioSynth {
  public ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public masterGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /** Opens the audio context ahead of the first sound (it takes a moment); call from a user gesture. */
  public prepare() {
    this.initContext();
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  private play(fn: (ctx: AudioContext, masterGain: GainNode) => void) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    fn(this.ctx, this.masterGain);
  }

  public playFound(combo: number = 1) {
    this.play((ctx, masterGain) => synthFound(ctx, masterGain, combo));
  }

  public playWrong() {
    this.play((ctx, masterGain) => synthWrong(ctx, masterGain));
  }

  public playHint() {
    this.play((ctx, masterGain) => synthHint(ctx, masterGain));
  }

  public playPageTurn() {
    this.play((ctx, masterGain) => synthPageTurn(ctx, masterGain));
  }

  // The found creature / object answers with its own little sound.
  public playVoice(type?: SpriteType) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    playCreatureVoice(this.ctx, this.masterGain, type, this.ctx.currentTime + 0.22);
  }

  // Loupe fogs up after a burst of random clicks: a soft, sinking breath of air
  public playFog() {
    this.play((ctx, masterGain) => synthFog(ctx, masterGain));
  }

  // Playful double chirp when an optional hidden critter is spotted
  public playCreature() {
    this.play((ctx, masterGain) => synthCreature(ctx, masterGain));
  }

  // Soft leafy rustle when a shy creature ducks away just before the click
  public playRustle() {
    this.play((ctx, masterGain) => synthRustle(ctx, masterGain));
  }

  public playVictory() {
    this.play((ctx, masterGain) => synthVictory(ctx, masterGain));
  }
}

export const synth = new WebAudioSynth();
