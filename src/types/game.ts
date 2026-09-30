import { HiddenObject } from './level';

export interface LoupeState {
  x: number; // pixel position on book frame
  y: number;
  radius: number; // pixel radius
  zoom: number; // magnification factor
  isHeld: boolean;
  activeTarget?: string;
  nudgeDirection?: { x: number; y: number } | null;
}

export interface GameState {
  chapterId: string;
  sceneId: string;
  sceneIndex: number;
  score: number;
  foundItems: string[]; // List of object IDs found
  secretFound: boolean;
  mistakes: number;
  hintsUsed: number;
  remainingTime: number;
  isPaused: boolean;
  isCompleted: boolean;
  isGameOver: boolean;
  combo: number;
  comboTimer: number; // seconds left before combo resets
  activeHint: {
    level: 1 | 2 | 3;
    objectId: string;
    clueText?: string;
    radarPoint?: { x: number; y: number };
  } | null;
}

export type GameEvent =
  | { type: 'GAME_START'; payload: { chapterId: string; sceneId: string } }
  | { type: 'OBJECT_FOUND'; payload: { object: HiddenObject; combo: number; scoreEarned: number } }
  | { type: 'WRONG_CLICK'; payload: { x: number; y: number } }
  | { type: 'HINT_USED'; payload: { level: 1 | 2 | 3; objectId: string } }
  | { type: 'COMBO_EXPIRED' }
  | { type: 'TIME_TICK'; payload: { deltaSeconds: number } }
  | { type: 'SCENE_COMPLETE'; payload: { stars: number; totalScore: number } }
  | { type: 'PAGE_TURN_START' }
  | { type: 'PAGE_TURN_DONE'; payload: { nextSceneId: string } }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'RESTART_SCENE' };
