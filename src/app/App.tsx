import React, { useEffect, useMemo, useState } from 'react';
import { ScanSearch } from 'lucide-react';
import { useGame } from '../hooks/useGame';
import { HUD } from '../components/HUD/HUD';
import { Sketchbook } from '../components/Sketchbook/Sketchbook';
import { QuestPanel } from '../components/QuestPanel/QuestPanel';
import { VictoryScreen } from '../components/VictoryScreen/VictoryScreen';
import { TimeUpScreen } from '../components/VictoryScreen/TimeUpScreen';
import { PauseMenu } from '../components/PauseMenu/PauseMenu';
import { StoryPrologue } from '../components/ChapterSelect/StoryPrologue';
import { PlateSelector } from '../components/PlateSelector/PlateSelector';
import { CreatureAlbum } from '../components/Album/CreatureAlbum';
import { ScoreEngine } from '../game/ScoreEngine';

export const App: React.FC = () => {
  const {
    chapter,
    currentLevel,
    currentSceneIndex,
    isNight,
    totalScenes,
    allScenes,
    allChapters,
    gameState,
    isTurning,
    screenShake,
    floatingScores,
    soundEnabled,
    showPrologue,
    setShowPrologue,
    showNightIntro,
    setShowNightIntro,
    isFogged,
    unlockedNight,
    nightByDayId,
    handleInspect,
    handleUseHint,
    handleNextScene,
    handlePrevScene,
    handleSelectScene,
    handleToggleSound,
    handleTogglePause,
    handleExplore,
    handleReplay,
  } = useGame();

  const [debugMode, setDebugMode] = useState(false);
  const [showPlateSelector, setShowPlateSelector] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);

  // Stable between timer ticks so the painted sprite layers only re-render on a find
  const foundObjectsList = useMemo(
    () => currentLevel.objects.filter((obj) => gameState.foundItems.includes(obj.id)),
    [currentLevel, gameState.foundItems]
  );

  const albumLevels = useMemo(() => [...allScenes, ...Object.values(nightByDayId)], [allScenes, nightByDayId]);

  const radarTarget = gameState.activeHint?.radarPoint
    ? currentLevel.objects.find((o) => o.id === gameState.activeHint!.objectId) ?? null
    : null;

  // Explore mode: critters & secret still hiding after the case was closed
  const leftovers = currentLevel.objects.filter(
    (o) => (o.isBonus || o.isSecret) && !gameState.foundItems.includes(o.id)
  ).length;

  useEffect(() => {
    if (gameState.isExploring && leftovers === 0) handleExplore(false);
  }, [gameState.isExploring, leftovers, handleExplore]);

  const { timeBonus, stars } = ScoreEngine.calculateCompletionBonus(
    gameState.remainingTime,
    gameState.mistakes,
    gameState.hintsUsed
  );

  return (
    <div className={`game-container ${screenShake ? 'screen-shake' : ''} ${isNight ? 'night-mode' : ''}`}>
      {/* Background painted ground & botanical wash */}
      <div className="app-wash" aria-hidden="true" />
      <img
        src="/assets/ui/botany-left.png"
        className="botany-leaf left"
        alt=""
        aria-hidden="true"
      />
      <img
        src="/assets/ui/botany-right.png"
        className="botany-leaf right"
        alt=""
        aria-hidden="true"
      />

      {/* Floating score notifications */}
      {floatingScores.map((f) => (
        <div
          key={f.id}
          className={`floating-score ${f.variant === 'info' ? 'info' : ''}`}
          style={{ left: `${f.x}px`, top: `${f.y}px` }}
        >
          {f.text}
        </div>
      ))}

      {/* Top HUD */}
      <HUD
        level={currentLevel}
        currentIndex={currentSceneIndex}
        totalScenes={totalScenes}
        score={gameState.score}
        remainingTime={gameState.remainingTime}
        combo={gameState.combo}
        comboTimer={gameState.comboTimer}
        hintsUsed={gameState.hintsUsed}
        soundEnabled={soundEnabled}
        debugMode={debugMode}
        isNight={isNight}
        onOpenPlateSelector={() => setShowPlateSelector(true)}
        onOpenAlbum={() => setShowAlbum(true)}
        onPrevScene={handlePrevScene}
        onNextScene={handleNextScene}
        onToggleSound={handleToggleSound}
        onToggleDebug={() => setDebugMode((prev) => !prev)}
        onUseHint={handleUseHint}
        onPause={handleTogglePause}
      />

      {/* Main 3D Sketchbook & Loupe */}
      <Sketchbook
        sceneImage={currentLevel.sceneImage}
        isTurning={isTurning}
        foundObjects={foundObjectsList}
        foundAt={gameState.foundAt}
        allObjects={currentLevel.objects}
        debugMode={debugMode}
        radarTarget={radarTarget}
        isNight={isNight}
        nightLights={currentLevel.nightLights}
        fogged={isFogged}
        onInspect={handleInspect}
      />

      {/* Explore mode banner */}
      {gameState.isCompleted && gameState.isExploring && (
        <div className="explore-banner" role="status">
          <ScanSearch size={16} />
          <span>
            Khám phá tự do · còn <b>{leftovers}</b> vật ẩn — không tính giờ, không trừ điểm
          </span>
          <button className="explore-done-btn" onClick={() => handleExplore(false)}>
            Xong
          </button>
        </div>
      )}

      {/* Bottom Quest Panel */}
      <QuestPanel
        objects={currentLevel.objects}
        foundIds={gameState.foundItems}
        activeHintId={gameState.activeHint?.objectId}
      />

      {/* Plate Selector (Mục Lục 9 Trang Ký Họa) */}
      <PlateSelector
        isOpen={showPlateSelector}
        currentIndex={currentSceneIndex}
        isNight={isNight}
        allScenes={allScenes}
        allChapters={allChapters}
        nightByDayId={nightByDayId}
        onSelectScene={handleSelectScene}
        onClose={() => setShowPlateSelector(false)}
      />

      {/* Creature album */}
      {showAlbum && <CreatureAlbum levels={albumLevels} onClose={() => setShowAlbum(false)} />}

      {/* Story Prologue Modal */}
      {showPrologue && (
        <StoryPrologue
          chapter={chapter}
          onStartGame={() => setShowPrologue(false)}
        />
      )}

      {/* Night page intro */}
      {!showPrologue && showNightIntro && isNight && (
        <StoryPrologue
          chapter={chapter}
          nightLevel={currentLevel}
          onStartGame={() => setShowNightIntro(false)}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState.isPaused && (
        <PauseMenu
          level={currentLevel}
          soundEnabled={soundEnabled}
          onResume={handleTogglePause}
          onRestart={handleReplay}
          onToggleSound={handleToggleSound}
          onExit={() => setShowPrologue(true)}
        />
      )}

      {/* Time's up */}
      {gameState.isGameOver && !gameState.isCompleted && (
        <TimeUpScreen
          level={currentLevel}
          foundIds={gameState.foundItems}
          onReplay={handleReplay}
          onOpenIndex={() => setShowPlateSelector(true)}
        />
      )}

      {/* Victory / Case Solved Modal */}
      {gameState.isCompleted && !gameState.isExploring && (
        <VictoryScreen
          level={currentLevel}
          score={gameState.score}
          stars={stars}
          timeBonus={timeBonus}
          timeTaken={currentLevel.timeLimit - gameState.remainingTime}
          mistakes={gameState.mistakes}
          hintsUsed={gameState.hintsUsed}
          isSecretFound={gameState.secretFound}
          foundIds={gameState.foundItems}
          hasNextScene={currentSceneIndex < totalScenes - 1}
          nightUnlocked={unlockedNight ?? undefined}
          onNextScene={handleNextScene}
          onReplay={handleReplay}
          onExplore={() => handleExplore(true)}
        />
      )}
    </div>
  );
};
export default App;
