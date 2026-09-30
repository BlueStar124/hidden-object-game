export interface SceneResult {
  sceneId: string;
  stars: number;
  highScore: number;
  bestTime: number;
  completedAt: string;
  creaturesFound?: string[]; // Optional hidden critters ever spotted on this page
}

export interface PlayerSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  ambientEnabled: boolean;
  screenShake: boolean;
  reducedMotion: boolean;
  volume: number; // 0 to 1
}

export interface GameProgress {
  currentChapter: number;
  unlockedScenes: string[];
  sceneResults: Record<string, SceneResult>;
  totalScore: number;
  unlockedLoupes: string[];
  activeLoupeSkin: string;
  settings: PlayerSettings;
}
