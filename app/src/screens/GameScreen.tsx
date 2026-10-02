import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Board } from '../board/Board';
import { leftovers } from '../core/caseFile';
import type { Page } from '../core/model';
import { completionBonus } from '../core/scoring';
import { allPages } from '../content';
import { useGame } from '../game/useGame';
import { sound } from '../platform/sound';
import { useStableCallback } from '../ui/useStableCallback';
import { colors } from '../ui/theme';
import { Desk } from './Desk';
import { CreatureAlbum } from './dialogs/CreatureAlbum';
import { PageIndex } from './dialogs/PageIndex';
import { PauseMenu } from './dialogs/PauseMenu';
import { RotatePrompt } from './dialogs/RotatePrompt';
import { StoryPrologue } from './dialogs/StoryPrologue';
import { TimeUpScreen } from './dialogs/TimeUpScreen';
import { VictoryScreen } from './dialogs/VictoryScreen';
import { FloatingScores } from './hud/FloatingScores';
import { HUD, type HudLayout } from './hud/HUD';
import { QuestPanel } from './hud/QuestPanel';
import { useDeviceBehaviour } from './useDeviceBehaviour';

/**
 * The one screen of the game: the desk with the sketchbook (Board), the HUD above it, the clue
 * cards below, and the dialogs (story, pause, victory, index, album) over everything.
 */
export const GameScreen: React.FC = () => {
  const { nav, case: kase, notices, soundEnabled, toggleSound } = useGame();
  const { country, pages, ref, page, isNight, turn, showPrologue, setShowPrologue, showNightIntro, setShowNightIntro } = nav;
  const c = kase.state;
  const isTurning = turn !== null;

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const layout: HudLayout = height < 500 ? 'phoneLandscape' : width < 700 ? 'phone' : 'wide';

  const [showIndex, setShowIndex] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  // The apps are locked to landscape; an upright phone browser is asked to turn sideways
  const [keepPortrait, setKeepPortrait] = useState(false);
  const askToRotate = Platform.OS === 'web' && height > width && width < 700 && !keepPortrait;
  const rootRef = useRef<View>(null);
  const [rootOffset, setRootOffset] = useState({ x: 0, y: 0 });

  /* ------------------------------- Derived state ------------------------------- */

  // The pages either side are prepared while this one is played, so turning to them is instant
  // (back from a night page is its own day page)
  const nextDay = pages[ref.index + 1]?.day;
  const backDay = isNight ? ref.day : pages[ref.index - 1]?.day;
  const preload = useMemo(() => {
    // Decode the neighbour beyond the destination during this turn, ready for a rapid next tap.
    const target = turn ? pages.findIndex((p) => p.day.id === turn.to.id || p.night?.id === turn.to.id) : -1;
    const ahead = turn && target >= 0 ? pages[target + turn.direction]?.day : undefined;
    return [nextDay, backDay, ahead].filter((p, i, all): p is Page => !!p && all.indexOf(p) === i);
  }, [nextDay, backDay, pages, turn]);

  const albumPages = useMemo(() => allPages(), []);
  const hint = c.activeHint;
  const radarTargetId = hint?.radarPoint ? hint.objectId : null;
  // Hint tier 2: the loupe tugs towards the target
  const nudgeTarget = useMemo(
    () => (hint?.level === 2 ? (page.objects.find((o) => o.id === hint.objectId) ?? null) : null),
    [hint, page]
  );

  // Explore mode: critters & secret still hiding after the case was closed
  const left = leftovers(c, page).length;
  const { explore, togglePause } = kase;
  const finishExplore = useCallback(() => explore(false), [explore]);
  useEffect(() => {
    if (c.isExploring && left === 0) explore(false);
  }, [c.isExploring, left, explore]);

  const { timeBonus, stars } = completionBonus(c.remainingTime, c.mistakes, c.hintsUsed);
  const nightIntroOpen = showNightIntro && isNight;

  // Nothing covers the sketchbook (its gestures would otherwise fire under the dialogs)
  const boardActive =
    !showIndex &&
    !showAlbum &&
    !showPrologue &&
    !nightIntroOpen &&
    !c.isPaused &&
    !(c.isGameOver && !c.isCompleted) &&
    !(c.isCompleted && !c.isExploring) &&
    !askToRotate;

  const playing = !c.isPaused && !c.isCompleted && !c.isGameOver && !showPrologue && !nightIntroOpen;

  /* ------------------------------ Device & feedback ------------------------------ */

  // Voices of this page's creatures are loaded ahead so the first "meow" is instant
  useEffect(() => {
    sound.prepareVoices(page.objects.map((o) => o.spriteType));
  }, [page]);

  const closeTopSheet = useCallback(() => {
    if (showAlbum) setShowAlbum(false);
    else if (showIndex) setShowIndex(false);
    else return false;
    return true;
  }, [showAlbum, showIndex]);
  useDeviceBehaviour({ playing, paused: c.isPaused, onPause: togglePause, closeTopSheet });

  // Screen shake on a wrong guess
  const shake = useSharedValue(0);
  useEffect(() => {
    if (!kase.screenShake) return;
    const step = (x: number) => withTiming(x, { duration: 35 });
    shake.value = withSequence(step(-2), step(3), step(-5), step(5), step(-5), step(5), step(-5), step(3), step(-2), step(0));
  }, [kase.screenShake, shake]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  // Stable handlers: the HUD and the board skip the re-render of every clock tick
  const openIndex = useCallback(() => setShowIndex(true), []);
  const openAlbum = useCallback(() => setShowAlbum(true), []);
  const requestHint = useStableCallback(kase.requestHint);
  const inspect = useStableCallback(kase.inspect);

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
        page={page}
        chapterNumber={ref.chapterNumber}
        pageIndex={ref.index}
        pageCount={pages.length}
        score={c.score}
        remainingTime={c.remainingTime}
        combo={c.combo}
        comboTimer={c.comboTimer}
        soundEnabled={soundEnabled}
        isNight={isNight}
        topInset={insets.top}
        insetLeft={insets.left}
        insetRight={insets.right}
        exploreRemaining={c.isCompleted && c.isExploring ? left : null}
        onFinishExplore={finishExplore}
        onOpenIndex={openIndex}
        onOpenAlbum={openAlbum}
        onPrevPage={nav.prev}
        onNextPage={nav.next}
        onToggleSound={toggleSound}
        onUseHint={requestHint}
        onPause={togglePause}
      />

      {/* The sketchbook runs under the camera cut-out too: only the controls keep clear of it */}
      <View style={styles.boardArea}>
        <Board
          page={page}
          foundIds={c.foundItems}
          foundAt={c.foundAt}
          radarTargetId={radarTargetId}
          nudgeTarget={nudgeTarget}
          turn={turn}
          fogged={kase.isFogged}
          onInspect={inspect}
          preload={preload}
          active={boardActive}
        />
      </View>

      <QuestPanel
        layout={layout}
        objects={page.objects}
        foundIds={c.foundItems}
        activeHintId={hint?.objectId}
        bottomInset={insets.bottom}
        insetLeft={insets.left}
        insetRight={insets.right}
      />

      <FloatingScores items={notices} origin={rootOffset} />

      {showIndex && (
        <PageIndex
          country={country}
          current={ref}
          isNight={isNight}
          onSelect={(index, night, countryId) => nav.goTo(index, night, countryId)}
          onClose={() => setShowIndex(false)}
        />
      )}

      {showAlbum && <CreatureAlbum pages={albumPages} onClose={() => setShowAlbum(false)} />}

      {showPrologue && (
        <StoryPrologue chapter={ref.chapter} chapterNumber={ref.chapterNumber} onStartGame={() => setShowPrologue(false)} />
      )}

      {!showPrologue && nightIntroOpen && (
        <StoryPrologue
          chapter={ref.chapter}
          chapterNumber={ref.chapterNumber}
          nightPage={page}
          onStartGame={() => setShowNightIntro(false)}
        />
      )}

      {c.isPaused && !showPrologue && (
        <PauseMenu
          page={page}
          soundEnabled={soundEnabled}
          onResume={togglePause}
          onRestart={nav.replay}
          onToggleSound={toggleSound}
          onExit={() => {
            // Back to the case file; the clock stays stopped while it is open
            togglePause();
            setShowPrologue(true);
          }}
        />
      )}

      {/* Both close as soon as a page starts turning, so the turn shows */}
      {c.isGameOver && !c.isCompleted && !isTurning && (
        <TimeUpScreen page={page} foundIds={c.foundItems} onReplay={nav.replay} onOpenIndex={openIndex} />
      )}

      {askToRotate && <RotatePrompt onKeepPortrait={() => setKeepPortrait(true)} />}

      {c.isCompleted && !c.isExploring && !isTurning && (
        <VictoryScreen
          page={page}
          score={c.score}
          stars={stars}
          timeBonus={timeBonus}
          timeTaken={page.timeLimit - c.remainingTime}
          mistakes={c.mistakes}
          hintsUsed={c.hintsUsed}
          isSecretFound={c.secretFound}
          foundIds={c.foundItems}
          hasNextPage={ref.index < pages.length - 1}
          nightUnlocked={kase.unlockedNight ?? undefined}
          onNextPage={nav.next}
          onReplay={nav.replay}
          onExplore={() => explore(true)}
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
});
