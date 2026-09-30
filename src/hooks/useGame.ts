import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types/game';
import { HiddenObject, LevelData } from '../types/level';
import { ALL_SCENES, ALL_CHAPTERS, getChapterBySceneIndex } from '../levels/chapters';
import { createInitialGameState, isMainObject } from '../game/GameState';
import { detectObject } from '../game/DetectionEngine';
import { ScoreEngine } from '../game/ScoreEngine';
import { HintEngine } from '../game/HintEngine';
import { audioManager } from '../game/AudioManager';
import { SaveManager } from '../game/SaveManager';

export interface FloatingNotification {
  id: string;
  text: string;
  x: number;
  y: number;
  variant?: 'score' | 'info';
}

export function useGame() {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const currentLevel: LevelData = ALL_SCENES[currentSceneIndex];
  const chapter = getChapterBySceneIndex(currentSceneIndex);

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(currentLevel, chapter.id)
  );

  const [isTurning, setIsTurning] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [floatingScores, setFloatingScores] = useState<FloatingNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPrologue, setShowPrologue] = useState(true);

  const lastLoupePos = useRef({ nx: 0.5, ny: 0.5 });

  const showFloating = useCallback(
    (text: string, screenPos: { x: number; y: number }, variant: FloatingNotification['variant'] = 'score') => {
      const floatId = Math.random().toString();
      setFloatingScores((prev) => [
        ...prev,
        { id: floatId, text, x: screenPos.x, y: screenPos.y, variant },
      ]);
      setTimeout(() => {
        setFloatingScores((prev) => prev.filter((f) => f.id !== floatId));
      }, variant === 'info' ? 1800 : 1200);
    },
    []
  );

  // Reset or switch scene
  const loadScene = useCallback((index: number) => {
    const validIndex = Math.max(0, Math.min(index, ALL_SCENES.length - 1));
    const level = ALL_SCENES[validIndex];
    const ch = getChapterBySceneIndex(validIndex);
    setCurrentSceneIndex(validIndex);
    setGameState(createInitialGameState(level, ch.id));
    setIsTurning(false);
  }, []);

  // Timer loop
  useEffect(() => {
    if (gameState.isPaused || gameState.isCompleted || gameState.isGameOver || showPrologue) {
      return;
    }

    const timer = setInterval(() => {
      setGameState((prev) => {
        // Decrease remaining time
        const newTime = Math.max(0, prev.remainingTime - 1);
        const isTimeOver = newTime === 0;

        // Combo decay
        let newCombo = prev.combo;
        let newComboTimer = Math.max(0, prev.comboTimer - 1);
        if (newComboTimer === 0 && prev.combo > 1) {
          newCombo = 1;
        }

        return {
          ...prev,
          remainingTime: newTime,
          combo: newCombo,
          comboTimer: newComboTimer,
          isGameOver: isTimeOver,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isPaused, gameState.isCompleted, gameState.isGameOver, showPrologue]);

  // Object Inspection / Click Handler
  const handleInspect = useCallback(
    (nx: number, ny: number, screenPos: { x: number; y: number }) => {
      if (gameState.isPaused || gameState.isCompleted || isTurning) return;

      lastLoupePos.current = { nx, ny };

      const result = detectObject(
        nx,
        ny,
        currentLevel.objects,
        gameState.foundItems
      );

      if (result.hit && result.object) {
        const foundObj = result.object;

        // Sound & Score
        audioManager.playFound(gameState.combo);
        if (foundObj.isBonus) audioManager.playCreature();

        const { earnedScore, newScore, combo } = ScoreEngine.calculateFoundScore(
          foundObj.score,
          gameState.combo,
          gameState.score
        );

        // Spawn floating score badge
        const tag = foundObj.isBonus ? ' · Sinh vật ẩn!' : foundObj.isSecret ? ' · Bí mật!' : '';
        showFloating(`+${earnedScore}${combo > 1 ? ` (×${combo})` : ''}${tag}`, screenPos);

        setGameState((prev) => {
          const updatedFound = [...prev.foundItems, foundObj.id];
          const normalObjects = currentLevel.objects.filter(isMainObject);
          const allNormalFound = normalObjects.every((o) => updatedFound.includes(o.id));

          if (allNormalFound) {
            // Victory!
            audioManager.playVictory();
            const { timeBonus, stars } = ScoreEngine.calculateCompletionBonus(
              prev.remainingTime,
              prev.mistakes,
              prev.hintsUsed
            );

            const nextScene = ALL_SCENES[currentSceneIndex + 1];
            const bonusFound = currentLevel.objects
              .filter((o) => o.isBonus && updatedFound.includes(o.id))
              .map((o) => o.id);
            SaveManager.recordSceneVictory(
              currentLevel.id,
              nextScene ? nextScene.id : null,
              newScore + timeBonus,
              stars,
              currentLevel.timeLimit - prev.remainingTime,
              bonusFound
            );

            return {
              ...prev,
              foundItems: updatedFound,
              secretFound: foundObj.isSecret ? true : prev.secretFound,
              score: newScore + timeBonus,
              combo: combo + 1,
              comboTimer: 6,
              isCompleted: true,
              activeHint: null,
            };
          }

          return {
            ...prev,
            foundItems: updatedFound,
            secretFound: foundObj.isSecret ? true : prev.secretFound,
            score: newScore,
            combo: combo + 1,
            comboTimer: 6,
            activeHint: null,
          };
        });
      } else if (result.hidingObject) {
        // Right spot, wrong moment: the shy creature has ducked out of sight
        audioManager.playRustle();
        showFloating('Suỵt… nó vừa trốn mất! Chờ nó ló ra nhé', screenPos, 'info');
      } else {
        // Wrong Click
        audioManager.playWrong();
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 350);

        setGameState((prev) => ({
          ...prev,
          mistakes: prev.mistakes + 1,
          combo: 1,
          comboTimer: 0,
          score: ScoreEngine.calculateMistakePenalty(prev.score),
        }));
      }
    },
    [gameState, currentLevel, isTurning, currentSceneIndex, showFloating]
  );

  // Use Hint
  const handleUseHint = useCallback(() => {
    if (gameState.isCompleted || gameState.isPaused) return;

    const currentHintLvl = gameState.activeHint?.level || 0;
    const hint = HintEngine.generateHint(
      currentHintLvl,
      currentLevel.objects,
      gameState.foundItems,
      lastLoupePos.current
    );

    if (!hint) return;

    audioManager.playHint();

    setGameState((prev) => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
      score: ScoreEngine.calculateHintPenalty(prev.score, hint.level),
      activeHint: {
        level: hint.level,
        objectId: hint.targetObject.id,
        clueText: hint.clueText,
        radarPoint: hint.radarPoint,
      },
    }));
  }, [gameState, currentLevel]);

  // Turn page to next level
  const handleNextScene = useCallback(() => {
    if (currentSceneIndex >= ALL_SCENES.length - 1) {
      // Reached the end of all 9 scenes
      loadScene(0);
      return;
    }

    const nextIndex = currentSceneIndex + 1;
    const currentCh = getChapterBySceneIndex(currentSceneIndex);
    const nextCh = getChapterBySceneIndex(nextIndex);

    setIsTurning(true);
    audioManager.playPageTurn();

    setTimeout(() => {
      loadScene(nextIndex);
      if (nextCh.id !== currentCh.id) {
        setShowPrologue(true);
      }
    }, 900);
  }, [currentSceneIndex, loadScene]);

  // Turn page to previous level
  const handlePrevScene = useCallback(() => {
    if (currentSceneIndex <= 0) return;

    const prevIndex = currentSceneIndex - 1;
    setIsTurning(true);
    audioManager.playPageTurn();

    setTimeout(() => {
      loadScene(prevIndex);
    }, 900);
  }, [currentSceneIndex, loadScene]);

  // Direct select scene from Plate Selector / Index
  const handleSelectScene = useCallback(
    (index: number) => {
      if (index === currentSceneIndex) return;
      setIsTurning(true);
      audioManager.playPageTurn();
      setTimeout(() => {
        loadScene(index);
      }, 600);
    },
    [currentSceneIndex, loadScene]
  );

  const handleToggleSound = useCallback(() => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    audioManager.setSoundEnabled(nextState);
  }, [soundEnabled]);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  return {
    chapter,
    currentLevel,
    currentSceneIndex,
    totalScenes: ALL_SCENES.length,
    allScenes: ALL_SCENES,
    allChapters: ALL_CHAPTERS,
    gameState,
    isTurning,
    screenShake,
    floatingScores,
    soundEnabled,
    showPrologue,
    setShowPrologue,
    handleInspect,
    handleUseHint,
    handleNextScene,
    handlePrevScene,
    handleSelectScene,
    handleToggleSound,
    handleTogglePause,
    handleReplay: () => loadScene(currentSceneIndex),
  };
}
