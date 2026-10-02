import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types/game';
import { HiddenObject, LevelData } from '../types/level';
import { ALL_SCENES, ALL_CHAPTERS, NIGHT_BY_DAY_ID, getChapterBySceneIndex } from '../levels/chapters';
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

/** How long a page takes to turn: the new page is loaded once the leaf has come down. */
export const PAGE_TURN_MS = 900;

/** A page turn in progress: where it goes, and which way the leaf turns. */
export interface PageTurn {
  level: LevelData;
  /** 1: forwards (the right-hand page turns over to the left), -1: backwards */
  direction: 1 | -1;
}

// Anti-spam: this many wrong clicks within the window fogs up the loupe for a moment
const FOG_MISSES = 4;
const FOG_WINDOW_MS = 3000;
const FOG_DURATION_MS = 3000;

function resolveLevel(index: number, night: boolean): LevelData {
  const day = ALL_SCENES[index];
  return (night && NIGHT_BY_DAY_ID[day.id]) || day;
}

export function useGame() {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isNight, setIsNight] = useState(false);
  const currentLevel: LevelData = resolveLevel(currentSceneIndex, isNight);
  const chapter = getChapterBySceneIndex(currentSceneIndex);

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(currentLevel, chapter.id)
  );

  const [turn, setTurn] = useState<PageTurn | null>(null);
  const isTurning = turn !== null;
  const [screenShake, setScreenShake] = useState(false);
  const [floatingScores, setFloatingScores] = useState<FloatingNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPrologue, setShowPrologue] = useState(true);
  const [showNightIntro, setShowNightIntro] = useState(false);
  const [fogUntil, setFogUntil] = useState(0);
  const [unlockedNight, setUnlockedNight] = useState<string | null>(null);

  const lastLoupePos = useRef({ nx: 0.5, ny: 0.5 });
  const recentMisses = useRef<number[]>([]);
  const lastFogNotice = useRef(0);

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

  // Reset or switch scene (night: the page's night variant, if it has one)
  const loadScene = useCallback((index: number, night: boolean = false) => {
    const validIndex = Math.max(0, Math.min(index, ALL_SCENES.length - 1));
    const nightOn = night && !!NIGHT_BY_DAY_ID[ALL_SCENES[validIndex].id];
    const level = resolveLevel(validIndex, nightOn);
    const ch = getChapterBySceneIndex(validIndex);
    setCurrentSceneIndex(validIndex);
    setIsNight(nightOn);
    setGameState(createInitialGameState(level, ch.id));
    setTurn(null);
    setFogUntil(0);
    recentMisses.current = [];
    setShowNightIntro(nightOn);
    setUnlockedNight(null);
  }, []);

  // Clear the fog once it has lifted, so the loupe re-renders clean
  useEffect(() => {
    if (!fogUntil) return;
    const t = setTimeout(() => setFogUntil(0), Math.max(0, fogUntil - Date.now()));
    return () => clearTimeout(t);
  }, [fogUntil]);

  // Timer loop
  useEffect(() => {
    if (
      gameState.isPaused ||
      gameState.isCompleted ||
      gameState.isGameOver ||
      showPrologue ||
      showNightIntro
    ) {
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
  }, [gameState.isPaused, gameState.isCompleted, gameState.isGameOver, showPrologue, showNightIntro]);

  // After the case is closed: hunt the remaining critters & secret for the album (no score)
  const inspectWhileExploring = useCallback(
    (nx: number, ny: number, screenPos: { x: number; y: number }) => {
      const leftovers = currentLevel.objects.filter((o) => o.isBonus || o.isSecret);
      const result = detectObject(nx, ny, leftovers, gameState.foundItems);

      if (result.hit && result.object) {
        const foundObj = result.object;
        audioManager.playFound(1);
        audioManager.playVoice(foundObj.spriteType);
        SaveManager.recordDiscovery(currentLevel.id, foundObj.id);
        showFloating(`${foundObj.name} · đã ghi vào Sổ Tay!`, screenPos, 'info');
        setGameState((prev) => ({
          ...prev,
          foundItems: [...prev.foundItems, foundObj.id],
          foundAt: result.position ? { ...prev.foundAt, [foundObj.id]: result.position } : prev.foundAt,
          secretFound: foundObj.isSecret ? true : prev.secretFound,
        }));
      } else if (result.hidingObject) {
        audioManager.playRustle();
        showFloating('Suỵt… nó vừa trốn mất! Chờ nó ló ra nhé', screenPos, 'info');
      }
    },
    [currentLevel, gameState.foundItems, showFloating]
  );

  // Object Inspection / Click Handler
  const handleInspect = useCallback(
    (nx: number, ny: number, screenPos: { x: number; y: number }) => {
      if (gameState.isPaused || gameState.isGameOver || isTurning) return;
      if (gameState.isCompleted) {
        if (gameState.isExploring) inspectWhileExploring(nx, ny, screenPos);
        return;
      }

      lastLoupePos.current = { nx, ny };

      // Fogged loupe: nothing can be inspected until it clears
      if (Date.now() < fogUntil) {
        if (Date.now() - lastFogNotice.current > 900) {
          lastFogNotice.current = Date.now();
          showFloating('Kính lúp còn mờ hơi nước…', screenPos, 'info');
        }
        return;
      }

      const result = detectObject(
        nx,
        ny,
        currentLevel.objects,
        gameState.foundItems
      );

      if (result.hit && result.object) {
        const foundObj = result.object;
        recentMisses.current = [];

        // Sound & Score
        audioManager.playFound(gameState.combo);
        audioManager.playVoice(foundObj.spriteType);
        SaveManager.recordDiscovery(currentLevel.id, foundObj.id);

        const { earnedScore, newScore, combo } = ScoreEngine.calculateFoundScore(
          foundObj.score,
          gameState.combo,
          gameState.score
        );

        // Spawn floating score badge
        const tag = foundObj.isBonus ? ' · Sinh vật ẩn!' : foundObj.isSecret ? ' · Bí mật!' : '';
        showFloating(`+${earnedScore}${combo > 1 ? ` (×${combo})` : ''}${tag}`, screenPos);

        // Clicks are discrete events, so this render's state is current; side effects stay out
        // of the state updater (StrictMode may run updaters twice)
        const updatedFound = [...gameState.foundItems, foundObj.id];
        const foundAt = foundObj.roam && result.position
          ? { ...gameState.foundAt, [foundObj.id]: result.position }
          : gameState.foundAt;
        const allNormalFound = currentLevel.objects
          .filter(isMainObject)
          .every((o) => updatedFound.includes(o.id));

        if (allNormalFound) {
          // Victory!
          audioManager.playVictory();
          const { timeBonus, stars } = ScoreEngine.calculateCompletionBonus(
            gameState.remainingTime,
            gameState.mistakes,
            gameState.hintsUsed
          );

          const wasPassed = (SaveManager.getSceneProgress(currentLevel.id)?.stars ?? 0) > 0;
          const nextScene = ALL_SCENES[currentSceneIndex + 1];
          const bonusFound = currentLevel.objects
            .filter((o) => o.isBonus && updatedFound.includes(o.id))
            .map((o) => o.id);
          SaveManager.recordSceneVictory(
            currentLevel.id,
            nextScene ? nextScene.id : null,
            newScore + timeBonus,
            stars,
            currentLevel.timeLimit - gameState.remainingTime,
            bonusFound
          );

          // First clear of a day page opens its night variant
          const night = currentLevel.isNight ? undefined : NIGHT_BY_DAY_ID[currentLevel.id];
          setUnlockedNight(!wasPassed && night ? night.title : null);

          setGameState((prev) => ({
            ...prev,
            foundItems: updatedFound,
            foundAt,
            secretFound: foundObj.isSecret ? true : prev.secretFound,
            score: newScore + timeBonus,
            combo: combo + 1,
            comboTimer: 6,
            isCompleted: true,
            activeHint: null,
          }));
        } else {
          setGameState((prev) => ({
            ...prev,
            foundItems: updatedFound,
            foundAt,
            secretFound: foundObj.isSecret ? true : prev.secretFound,
            score: newScore,
            combo: combo + 1,
            comboTimer: 6,
            activeHint: null,
          }));
        }
      } else if (result.hidingObject) {
        // Right spot, wrong moment: the shy creature has ducked out of sight
        audioManager.playRustle();
        showFloating('Suỵt… nó vừa trốn mất! Chờ nó ló ra nhé', screenPos, 'info');
      } else {
        // Wrong Click
        const now = Date.now();
        recentMisses.current = [...recentMisses.current.filter((t) => now - t < FOG_WINDOW_MS), now];
        const fogged = recentMisses.current.length >= FOG_MISSES;

        if (fogged) {
          recentMisses.current = [];
          setFogUntil(now + FOG_DURATION_MS);
          lastFogNotice.current = now;
          audioManager.playFog();
          showFloating('Kính lúp mờ hơi nước! Bình tĩnh quan sát nào…', screenPos, 'info');
        } else {
          audioManager.playWrong();
        }
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
    [gameState, currentLevel, isTurning, currentSceneIndex, showFloating, fogUntil, inspectWhileExploring]
  );

  // Use Hint
  const handleUseHint = useCallback(() => {
    if (gameState.isCompleted || gameState.isPaused || gameState.isGameOver) return;

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

  // Starts turning the page; the target is loaded once the leaf has come down
  const turnPage = useCallback(
    (index: number, night: boolean, direction: 1 | -1, then?: () => void) => {
      setTurn({ level: resolveLevel(index, night), direction });
      audioManager.playPageTurn();
      setTimeout(() => {
        loadScene(index, night);
        then?.();
      }, PAGE_TURN_MS);
    },
    [loadScene]
  );

  // Turn page to next level (a night page continues with the next day page)
  const handleNextScene = useCallback(() => {
    if (isTurning) return;
    if (currentSceneIndex >= ALL_SCENES.length - 1) {
      // Reached the end of all 9 scenes
      loadScene(0);
      return;
    }

    const nextIndex = currentSceneIndex + 1;
    const currentCh = getChapterBySceneIndex(currentSceneIndex);
    const nextCh = getChapterBySceneIndex(nextIndex);

    turnPage(nextIndex, false, 1, () => {
      if (nextCh.id !== currentCh.id) {
        setShowPrologue(true);
      }
    });
  }, [currentSceneIndex, isTurning, loadScene, turnPage]);

  // Turn page to previous level
  const handlePrevScene = useCallback(() => {
    if (isTurning) return;
    if (currentSceneIndex <= 0 && !isNight) return;

    const prevIndex = isNight ? currentSceneIndex : currentSceneIndex - 1;
    turnPage(prevIndex, false, -1);
  }, [currentSceneIndex, isNight, isTurning, turnPage]);

  // Direct select scene from Plate Selector / Index (a page's night comes after its day)
  const handleSelectScene = useCallback(
    (index: number, night: boolean = false) => {
      if (isTurning) return;
      if (index === currentSceneIndex && night === isNight) return;
      const forwards = index > currentSceneIndex || (index === currentSceneIndex && night);
      turnPage(index, night, forwards ? 1 : -1);
    },
    [currentSceneIndex, isNight, isTurning, turnPage]
  );

  const handleToggleSound = useCallback(() => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    audioManager.setSoundEnabled(nextState);
  }, [soundEnabled]);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const handleExplore = useCallback((exploring: boolean) => {
    setGameState((prev) => (prev.isCompleted ? { ...prev, isExploring: exploring } : prev));
  }, []);

  return {
    chapter,
    currentLevel,
    currentSceneIndex,
    isNight,
    totalScenes: ALL_SCENES.length,
    allScenes: ALL_SCENES,
    allChapters: ALL_CHAPTERS,
    gameState,
    isTurning,
    turn,
    screenShake,
    floatingScores,
    soundEnabled,
    showPrologue,
    setShowPrologue,
    showNightIntro,
    setShowNightIntro,
    isFogged: fogUntil > 0,
    unlockedNight,
    nightByDayId: NIGHT_BY_DAY_ID,
    handleInspect,
    handleUseHint,
    handleNextScene,
    handlePrevScene,
    handleSelectScene,
    handleToggleSound,
    handleTogglePause,
    handleExplore,
    handleReplay: () => loadScene(currentSceneIndex, isNight),
  };
}
