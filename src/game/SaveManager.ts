import { GameProgress, PlayerSettings, SceneResult } from '../types/player';

const STORAGE_KEY = 'detective_sketchbook_progress_v1';

const DEFAULT_SETTINGS: PlayerSettings = {
  soundEnabled: true,
  musicEnabled: true,
  ambientEnabled: true,
  screenShake: true,
  reducedMotion: false,
  volume: 0.8,
};

const DEFAULT_PROGRESS: GameProgress = {
  currentChapter: 1,
  unlockedScenes: ['marina-bay-sands'],
  sceneResults: {},
  totalScore: 0,
  unlockedLoupes: ['classic-brass'],
  activeLoupeSkin: 'classic-brass',
  settings: DEFAULT_SETTINGS,
  discovered: {},
};

export class SaveManager {
  public static load(): GameProgress {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return DEFAULT_PROGRESS;
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_PROGRESS,
        ...parsed,
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings || {}),
        },
      };
    } catch {
      return DEFAULT_PROGRESS;
    }
  }

  public static save(progress: GameProgress): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Unable to save progress to localStorage', e);
    }
  }

  public static recordSceneVictory(
    sceneId: string,
    nextSceneId: string | null,
    score: number,
    stars: number,
    timeTaken: number,
    creaturesFound: string[] = []
  ): GameProgress {
    const current = this.load();
    const existing = current.sceneResults[sceneId];

    const result: SceneResult = {
      sceneId,
      stars: Math.max(stars, existing?.stars || 0),
      highScore: Math.max(score, existing?.highScore || 0),
      bestTime: existing ? Math.min(timeTaken, existing.bestTime) : timeTaken,
      completedAt: new Date().toISOString(),
      creaturesFound: Array.from(new Set([...(existing?.creaturesFound || []), ...creaturesFound])),
    };

    const unlockedScenes = [...current.unlockedScenes];
    if (nextSceneId && !unlockedScenes.includes(nextSceneId)) {
      unlockedScenes.push(nextSceneId);
    }

    const updated: GameProgress = {
      ...current,
      unlockedScenes,
      sceneResults: {
        ...current.sceneResults,
        [sceneId]: result,
      },
      totalScore: current.totalScore + score,
    };

    this.save(updated);
    return updated;
  }

  public static getSceneProgress(sceneId: string): SceneResult | undefined {
    const current = this.load();
    return current.sceneResults[sceneId];
  }

  /** Remembers a find straight away, even if the page is never finished. */
  public static recordDiscovery(levelId: string, objectId: string): void {
    const current = this.load();
    const seen = current.discovered[levelId] || [];
    if (seen.includes(objectId)) return;
    this.save({
      ...current,
      discovered: { ...current.discovered, [levelId]: [...seen, objectId] },
    });
  }

  /** All object ids ever spotted on a level (older saves only kept the bonus critters). */
  public static getDiscovered(levelId: string): string[] {
    const current = this.load();
    return Array.from(
      new Set([
        ...(current.discovered[levelId] || []),
        ...(current.sceneResults[levelId]?.creaturesFound || []),
      ])
    );
  }
}
