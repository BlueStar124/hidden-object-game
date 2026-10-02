import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import { ScanSearch } from './ui/icons';
import { useGame } from '@core/hooks/useGame';
import type { LevelData } from '@core/types/level';
import { ScoreEngine } from '@core/game/ScoreEngine';
import { Board } from './board/Board';
import { HUD, type HudLayout } from './components/HUD';
import { QuestPanel } from './components/QuestPanel';
import { FloatingScores } from './components/FloatingScores';
import { StoryPrologue } from './components/StoryPrologue';
import { PauseMenu } from './components/PauseMenu';
import { VictoryScreen } from './components/VictoryScreen';
import { TimeUpScreen } from './components/TimeUpScreen';
import { PlateSelector } from './components/PlateSelector';
import { CreatureAlbum } from './components/CreatureAlbum';
import { RotatePrompt } from './components/RotatePrompt';
import { audioManager } from './platform/AudioManager';
import { UI_ART } from './platform/assets';
import { colors, fonts } from './theme';

/** Painted desk behind the sketchbook: paper wash and foliage (dimmed on night pages). */
const Desk = React.memo<{ night: boolean; foliage: boolean }>(({ night, foliage }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Image source={UI_ART.wash} style={[StyleSheet.absoluteFill, { opacity: 0.88 }]} resizeMode="cover" />
    <LinearGradient
      colors={['rgba(236, 231, 220, 0.3)', 'rgba(236, 231, 220, 0.65)', colors.paper]}
      locations={[0, 0.6, 0.95]}
      style={StyleSheet.absoluteFill}
    />
    {foliage && (
      <>
        <Image
          source={UI_ART.botanyLeft}
          style={[styles.leaf, styles.leafLeft, night && { opacity: 0.2 }]}
          resizeMode="contain"
        />
        <Image
          source={UI_ART.botanyRight}
          style={[styles.leaf, styles.leafRight, night && { opacity: 0.2 }]}
          resizeMode="contain"
        />
      </>
    )}
    {night && <View style={[StyleSheet.absoluteFill, styles.nightDesk]} />}
  </View>
));

export const GameApp: React.FC = () => {
  useKeepAwake();
  const game = useGame();
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
    turn,
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
  } = game;

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const layout: HudLayout = height < 500 ? 'phoneLandscape' : width < 700 ? 'phone' : 'wide';

  const [showPlates, setShowPlates] = useState(false);
  // The apps are locked to landscape; an upright phone browser is asked to turn sideways
  const [keepPortrait, setKeepPortrait] = useState(false);
  const askToRotate = Platform.OS === 'web' && height > width && width < 700 && !keepPortrait;
  const [showAlbum, setShowAlbum] = useState(false);
  const rootRef = useRef<View>(null);
  const [rootOffset, setRootOffset] = useState({ x: 0, y: 0 });

  /* ------------------------------- Derived state ------------------------------- */

  // The pages either side are prepared while this one is played, so turning to them is instant
  // (back from a night page is its own day page)
  const nextScene = allScenes[currentSceneIndex + 1];
  const backScene = isNight ? allScenes[currentSceneIndex] : allScenes[currentSceneIndex - 1];
  const preload = useMemo(() => [nextScene, backScene].filter((s): s is LevelData => !!s), [nextScene, backScene]);

  const albumLevels = useMemo(() => [...allScenes, ...Object.values(nightByDayId)], [allScenes, nightByDayId]);
  const hint = gameState.activeHint;
  const radarTargetId = hint?.radarPoint ? hint.objectId : null;
  // Hint tier 2: the loupe tugs towards the target (described in the README, now wired up)
  const nudgeTarget = useMemo(
    () => (hint?.level === 2 ? (currentLevel.objects.find((o) => o.id === hint.objectId) ?? null) : null),
    [hint, currentLevel]
  );

  // Explore mode: critters & secret still hiding after the case was closed
  const leftovers = currentLevel.objects.filter((o) => (o.isBonus || o.isSecret) && !gameState.foundItems.includes(o.id)).length;
  useEffect(() => {
    if (gameState.isExploring && leftovers === 0) handleExplore(false);
  }, [gameState.isExploring, leftovers, handleExplore]);

  const { timeBonus, stars } = ScoreEngine.calculateCompletionBonus(
    gameState.remainingTime,
    gameState.mistakes,
    gameState.hintsUsed
  );

  // Nothing covers the sketchbook (its gestures would otherwise fire under the dialogs)
  const boardActive =
    !showPlates &&
    !showAlbum &&
    !showPrologue &&
    !(showNightIntro && isNight) &&
    !gameState.isPaused &&
    !(gameState.isGameOver && !gameState.isCompleted) &&
    !(gameState.isCompleted && !gameState.isExploring) &&
    !askToRotate;

  const playing =
    !gameState.isPaused && !gameState.isCompleted && !gameState.isGameOver && !showPrologue && !(showNightIntro && isNight);

  /* ------------------------------ Native behaviours ------------------------------ */

  // Voices of this page's creatures are loaded ahead so the first "meow" is instant
  useEffect(() => {
    audioManager.prepareVoices(currentLevel.objects.map((o) => o.spriteType));
  }, [currentLevel]);

  // Full screen on Android (swipe from the edge to bring the system bars back)
  useEffect(() => {
    if (Platform.OS === 'android') NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);

  // Leaving the app pauses the investigation
  const playingRef = useRef(playing);
  playingRef.current = playing;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && playingRef.current) handleTogglePause();
    });
    return () => sub.remove();
  }, [handleTogglePause]);

  // Android back button: close the top sheet, or pause instead of quitting mid-case
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showAlbum) setShowAlbum(false);
      else if (showPlates) setShowPlates(false);
      else if (gameState.isPaused || playing) handleTogglePause();
      else return false; // let Android leave the app
      return true;
    });
    return () => sub.remove();
  }, [showAlbum, showPlates, gameState.isPaused, playing, handleTogglePause]);

  // Screen shake on a wrong guess
  const shake = useSharedValue(0);
  useEffect(() => {
    if (!screenShake) return;
    const step = (x: number) => withTiming(x, { duration: 35 });
    shake.value = withSequence(step(-2), step(3), step(-5), step(5), step(-5), step(5), step(-5), step(3), step(-2), step(0));
  }, [screenShake, shake]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const measureRoot = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => setRootOffset({ x, y }));
  }, []);

  /* ----------------------------------- Render ----------------------------------- */

  return (
    <Animated.View ref={rootRef} style={[styles.root, shakeStyle]} onLayout={measureRoot}>
      <StatusBar hidden style={isNight ? 'light' : 'dark'} />
      <Desk night={isNight} foliage={width > 800} />

      <HUD
        layout={layout}
        level={currentLevel}
        currentIndex={currentSceneIndex}
        totalScenes={totalScenes}
        score={gameState.score}
        remainingTime={gameState.remainingTime}
        combo={gameState.combo}
        comboTimer={gameState.comboTimer}
        soundEnabled={soundEnabled}
        isNight={isNight}
        topInset={insets.top}
        insetLeft={insets.left}
        insetRight={insets.right}
        onOpenPlateSelector={() => setShowPlates(true)}
        onOpenAlbum={() => setShowAlbum(true)}
        onPrevScene={handlePrevScene}
        onNextScene={handleNextScene}
        onToggleSound={handleToggleSound}
        onUseHint={handleUseHint}
        onPause={handleTogglePause}
      />

      {/* The sketchbook runs under the camera cut-out too: only the controls keep clear of it */}
      <View style={styles.boardArea}>
        <Board
          level={currentLevel}
          foundIds={gameState.foundItems}
          foundAt={gameState.foundAt}
          radarTargetId={radarTargetId}
          nudgeTarget={nudgeTarget}
          turn={turn}
          fogged={isFogged}
          onInspect={handleInspect}
          preload={preload}
          active={boardActive}
        >
          {gameState.isCompleted && gameState.isExploring && (
            <Animated.View entering={FadeInDown} style={styles.explore} pointerEvents="box-none">
              <ScanSearch size={16} color={colors.emerald} />
              <Text style={styles.exploreText} numberOfLines={2}>
                Khám phá tự do · còn <Text style={{ fontWeight: '800' }}>{leftovers}</Text> vật ẩn — không tính giờ, không trừ
                điểm
              </Text>
              <Pressable onPress={() => handleExplore(false)} style={styles.exploreDone} hitSlop={6}>
                <Text style={styles.exploreDoneText}>Xong</Text>
              </Pressable>
            </Animated.View>
          )}
        </Board>
      </View>

      <QuestPanel
        layout={layout}
        objects={currentLevel.objects}
        foundIds={gameState.foundItems}
        activeHintId={hint?.objectId}
        bottomInset={insets.bottom}
        insetLeft={insets.left}
        insetRight={insets.right}
      />

      <FloatingScores items={floatingScores} origin={rootOffset} />

      {showPlates && (
        <PlateSelector
          currentIndex={currentSceneIndex}
          isNight={isNight}
          allScenes={allScenes}
          allChapters={allChapters}
          nightByDayId={nightByDayId}
          onSelectScene={handleSelectScene}
          onClose={() => setShowPlates(false)}
        />
      )}

      {showAlbum && <CreatureAlbum levels={albumLevels} onClose={() => setShowAlbum(false)} />}

      {showPrologue && <StoryPrologue chapter={chapter} onStartGame={() => setShowPrologue(false)} />}

      {!showPrologue && showNightIntro && isNight && (
        <StoryPrologue chapter={chapter} nightLevel={currentLevel} onStartGame={() => setShowNightIntro(false)} />
      )}

      {gameState.isPaused && !showPrologue && (
        <PauseMenu
          level={currentLevel}
          soundEnabled={soundEnabled}
          onResume={handleTogglePause}
          onRestart={handleReplay}
          onToggleSound={handleToggleSound}
          onExit={() => {
            // Back to the case file; the clock stays stopped while it is open
            handleTogglePause();
            setShowPrologue(true);
          }}
        />
      )}

      {/* Both close as soon as a page starts turning, so the turn shows */}
      {gameState.isGameOver && !gameState.isCompleted && !isTurning && (
        <TimeUpScreen
          level={currentLevel}
          foundIds={gameState.foundItems}
          onReplay={handleReplay}
          onOpenIndex={() => setShowPlates(true)}
        />
      )}

      {askToRotate && <RotatePrompt onKeepPortrait={() => setKeepPortrait(true)} />}

      {gameState.isCompleted && !gameState.isExploring && !isTurning && (
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  boardArea: {
    flex: 1,
  },
  leaf: {
    position: 'absolute',
    bottom: 0,
    width: 220,
    height: 300,
    opacity: 0.45,
  },
  leafLeft: {
    left: -20,
  },
  leafRight: {
    right: -10,
  },
  nightDesk: {
    backgroundColor: 'rgba(12, 16, 34, 0.45)',
  },
  explore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 5,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(240, 253, 244, 0.97)',
    borderWidth: 1,
    borderColor: '#86efac',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  exploreText: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.emerald,
    fontFamily: fonts.body,
  },
  exploreDone: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.emerald,
  },
  exploreDoneText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
