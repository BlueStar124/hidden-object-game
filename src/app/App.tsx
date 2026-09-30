import React, { useMemo, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { HUD } from '../components/HUD/HUD';
import { Sketchbook } from '../components/Sketchbook/Sketchbook';
import { QuestPanel } from '../components/QuestPanel/QuestPanel';
import { VictoryScreen } from '../components/VictoryScreen/VictoryScreen';
import { PauseMenu } from '../components/PauseMenu/PauseMenu';
import { StoryPrologue } from '../components/ChapterSelect/StoryPrologue';
import { PlateSelector } from '../components/PlateSelector/PlateSelector';
import { ScoreEngine } from '../game/ScoreEngine';

export const App: React.FC = () => {
  const {
    chapter,
    currentLevel,
    currentSceneIndex,
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
    handleInspect,
    handleUseHint,
    handleNextScene,
    handlePrevScene,
    handleSelectScene,
    handleToggleSound,
    handleTogglePause,
    handleReplay,
  } = useGame();

  const [debugMode, setDebugMode] = useState(false);
  const [showPlateSelector, setShowPlateSelector] = useState(false);

  // Stable between timer ticks so the painted sprite layers only re-render on a find
  const foundObjectsList = useMemo(
    () => currentLevel.objects.filter((obj) => gameState.foundItems.includes(obj.id)),
    [currentLevel, gameState.foundItems]
  );

  const { timeBonus, stars } = ScoreEngine.calculateCompletionBonus(
    gameState.remainingTime,
    gameState.mistakes,
    gameState.hintsUsed
  );

  return (
    <div className={`game-container ${screenShake ? 'screen-shake' : ''}`}>
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
        onOpenPlateSelector={() => setShowPlateSelector(true)}
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
        allObjects={currentLevel.objects}
        debugMode={debugMode}
        radarPoint={gameState.activeHint?.radarPoint}
        onInspect={handleInspect}
      />

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
        allScenes={allScenes}
        allChapters={allChapters}
        onSelectScene={handleSelectScene}
        onClose={() => setShowPlateSelector(false)}
      />

      {/* Story Prologue Modal */}
      {showPrologue && (
        <StoryPrologue
          chapter={chapter}
          onStartGame={() => setShowPrologue(false)}
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

      {/* Victory / Case Solved Modal */}
      {gameState.isCompleted && (
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
          onNextScene={handleNextScene}
          onReplay={handleReplay}
        />
      )}
    </div>
  );
};
export default App;
