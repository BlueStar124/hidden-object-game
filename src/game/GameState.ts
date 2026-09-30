import { GameState } from '../types/game';
import { HiddenObject, LevelData } from '../types/level';

/** Objects that must be found to close the case: not the secret, not the optional critters. */
export const isMainObject = (o: HiddenObject) => !o.isSecret && !o.isBonus;

export function createInitialGameState(level: LevelData, chapterId: string = 'chapter-01'): GameState {
  return {
    chapterId,
    sceneId: level.id,
    sceneIndex: level.sceneIndex,
    score: 0,
    foundItems: [],
    secretFound: false,
    mistakes: 0,
    hintsUsed: 0,
    remainingTime: level.timeLimit,
    isPaused: false,
    isCompleted: false,
    isGameOver: false,
    combo: 1,
    comboTimer: 0,
    activeHint: null,
  };
}
