import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { SpriteType } from '@core/types/level';
import { SFX, VOICES } from '../audio/sounds.generated';
import type { GameAudio } from './AudioManager';
import { haptics } from './haptics';

/**
 * iOS/Android twin of the shared AudioManager (same public API, see metro.config.js).
 * Plays the sounds pre-rendered from the web synth (`npm run generate`) and adds haptics.
 */

type Source = number;

// A couple of players per sound so quick repeats (combo chimes, rapid misses) overlap cleanly
const VOICES_PER_SOUND = 2;

class SoundBank {
  private players = new Map<Source, { list: AudioPlayer[]; next: number }>();

  private entry(source: Source) {
    let entry = this.players.get(source);
    if (!entry) {
      entry = { list: [], next: 0 };
      this.players.set(source, entry);
    }
    return entry;
  }

  /** Loads players ahead of time so the first play is instant. */
  prepare(sources: Source[]) {
    for (const source of sources) {
      const entry = this.entry(source);
      if (entry.list.length === 0) entry.list.push(createAudioPlayer(source));
    }
  }

  play(source: Source | undefined) {
    if (source === undefined) return;
    const entry = this.entry(source);
    let player = entry.list[entry.next % VOICES_PER_SOUND];
    if (!player) {
      player = createAudioPlayer(source);
      entry.list.push(player);
    }
    entry.next++;
    try {
      player.seekTo(0).catch(() => {});
      player.play();
    } catch {
      // A sound that cannot play must never break the game
    }
  }
}

class NativeAudioManager {
  private soundEnabled = true;
  private bank = new SoundBank();
  private ready = false;

  private init() {
    if (this.ready) return;
    this.ready = true;
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    this.bank.prepare([...SFX.found, SFX.wrong, SFX.hint, SFX.pageTurn, SFX.fog, SFX.rustle, SFX.victory]);
  }

  private play(source: Source | undefined) {
    if (!this.soundEnabled) return;
    this.init();
    this.bank.play(source);
  }

  /** Warms up the voices of the creatures & objects on a page. */
  public prepareVoices(types: (SpriteType | undefined)[]) {
    this.init();
    this.bank.prepare(types.map((t) => (t ? VOICES[t] : undefined)).filter((s): s is number => s !== undefined));
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public playFound(combo: number = 1) {
    haptics.found(combo);
    this.play(SFX.found[Math.max(0, Math.min(combo - 1, SFX.found.length - 1))]);
  }

  public playWrong() {
    haptics.wrong();
    this.play(SFX.wrong);
  }

  public playHint() {
    haptics.hint();
    this.play(SFX.hint);
  }

  public playPageTurn() {
    haptics.pageTurn();
    this.play(SFX.pageTurn);
  }

  // The found creature / object answers with its own little sound, just after the chime
  public playVoice(type?: SpriteType) {
    this.play(type ? VOICES[type] : undefined);
  }

  public playFog() {
    haptics.fog();
    this.play(SFX.fog);
  }

  public playCreature() {
    this.play(SFX.creature);
  }

  public playRustle() {
    haptics.rustle();
    this.play(SFX.rustle);
  }

  public playVictory() {
    haptics.victory();
    this.play(SFX.victory);
  }
}

export const audioManager: GameAudio = new NativeAudioManager();
