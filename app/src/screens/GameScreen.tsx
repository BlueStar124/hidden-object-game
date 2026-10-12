import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Board } from '../board/Board';
import { leftovers } from '../core/caseFile';
import { parseChallenge, type Challenge } from '../core/challenge';
import { dailyPuzzle } from '../core/daily';
import type { Chapter, Page } from '../core/model';
import { progress } from '../core/progress';
import { localDay } from '../core/random';
import { completionBonus } from '../core/scoring';
import { allPages } from '../content';
import { useGame } from '../game/useGame';
import { takeLaunchCode } from '../platform/launchLink';
import { sound } from '../platform/sound';
import { useStableCallback } from '../ui/useStableCallback';
import { colors } from '../ui/theme';
import { Desk } from './Desk';
import { Backup } from './dialogs/Backup';
import { ChallengeEntry } from './dialogs/ChallengeEntry';
import { CreatureAlbum } from './dialogs/CreatureAlbum';
import { DailyDone } from './dialogs/DailyDone';
import { Deduction } from './dialogs/Deduction';
import { MyCover } from './dialogs/MyCover';
import { PageIndex } from './dialogs/PageIndex';
import { Passport } from './dialogs/Passport';
import { PauseMenu } from './dialogs/PauseMenu';
import { RotatePrompt } from './dialogs/RotatePrompt';
import { StoryPrologue } from './dialogs/StoryPrologue';
import { TimeUpScreen } from './dialogs/TimeUpScreen';
import { VictoryScreen } from './dialogs/VictoryScreen';
import { HomeScreen } from './home/HomeScreen';
import { FloatingScores } from './hud/FloatingScores';
import { HUD, type HudLayout } from './hud/HUD';
import { QuestPanel } from './hud/QuestPanel';
import { challengeMessage, dailyShare, postcardMessage, victoryPostcard } from './share/messages';
import { useShare } from './share/useShare';
import { useDeviceBehaviour } from './useDeviceBehaviour';

/** A sheet over the game from the home screen (the index and the album have their own flags). */
type Sheet = 'passport' | 'cover' | 'challenge' | 'backup' | null;

/**
 * The one screen of the game: the desk with the sketchbook (Board), the HUD above it, the clue
 * cards below, the home screen over them when the game opens, and the dialogs (story, pause,
 * victory, index, album) over everything.
 */
export const GameScreen: React.FC = () => {
  const [showIndex, setShowIndex] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [deduction, setDeduction] = useState<{ chapter: Chapter; number: number } | null>(null);
  const browsing = showIndex || showAlbum || sheet !== null || deduction !== null;
  const { nav, case: kase, notices, soundEnabled, toggleSound, home, setHome } = useGame({ browsing });
  const { country, pages, ref, page, isNight, turn, mode, showPrologue, setShowPrologue, showNightIntro, setShowNightIntro } = nav;
  const c = kase.state;
  const isTurning = turn !== null;

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const layout: HudLayout = height < 500 ? 'phoneLandscape' : width < 700 ? 'phone' : 'wide';

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
  const timeTaken = page.timeLimit - c.remainingTime;
  const nightIntroOpen = showNightIntro && isNight;

  // The daily page of today (the same for every player); the day is read at every render, so the
  // page changes at midnight even with the game left open
  const today = localDay(new Date());
  const dayPages = useMemo(() => allPages().filter((p) => !p.isNight), []);
  const puzzle = useMemo(() => dailyPuzzle(today, dayPages), [today, dayPages]);
  const daily = !puzzle ? 'none' : progress.stamps()[today] ? 'done' : 'open';

  // Nothing covers the sketchbook (its gestures would otherwise fire under the dialogs)
  const boardActive =
    !home &&
    !browsing &&
    !showPrologue &&
    !nightIntroOpen &&
    !c.isPaused &&
    !(c.isGameOver && !c.isCompleted) &&
    !(c.isCompleted && !c.isExploring) &&
    !askToRotate;

  const playing = !home && !c.isPaused && !c.isCompleted && !c.isGameOver && !showPrologue && !nightIntroOpen;

  /* ------------------------------ Device & feedback ------------------------------ */

  // Voices of this page's creatures are loaded ahead so the first "meow" is instant
  useEffect(() => {
    sound.prepareVoices(page.objects.map((o) => o.spriteType));
  }, [page]);

  const closeTopSheet = useCallback(() => {
    if (deduction) setDeduction(null);
    else if (sheet) setSheet(null);
    else if (showAlbum) setShowAlbum(false);
    else if (showIndex) setShowIndex(false);
    else return false;
    return true;
  }, [deduction, sheet, showAlbum, showIndex]);
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

  // Home screen: carry on with the page the book is open at, or turn to another page (a country's
  // book from its card, any page from the index) — which also leaves the home screen
  const { goTo } = nav;
  const play = useCallback(() => setHome(false), [setHome]);
  const selectPage = useCallback(
    (index: number, night: boolean, countryId: string) => {
      goTo(index, night, countryId);
      setHome(false);
    },
    [goTo, setHome]
  );

  /* ------------------------- Daily page, challenges, sharing ------------------------- */

  const { openDaily: openDailyPage, openChallenge, leaveSpecial } = nav;
  const openPassport = useCallback(() => setSheet('passport'), []);
  const openCover = useCallback(() => setSheet('cover'), []);
  const enterChallenge = useCallback(() => setSheet('challenge'), []);
  const openBackup = useCallback(() => setSheet('backup'), []);
  // A backup brought back: the home screen reads the progress again (it reads it once when it opens)
  const [homeKey, setHomeKey] = useState(0);
  const restored = useCallback(() => setHomeKey((k) => k + 1), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const openDeduction = useCallback((chapter: Chapter, number: number) => setDeduction({ chapter, number }), []);

  const openDaily = useCallback(() => {
    if (!puzzle || !openDailyPage(puzzle)) return;
    setSheet(null);
    setHome(false);
  }, [puzzle, openDailyPage, setHome]);

  const playChallenge = useCallback(
    (challenge: Challenge) => {
      if (!openChallenge(challenge)) return false;
      setSheet(null);
      setShowIndex(false);
      setHome(false);
      return true;
    },
    [openChallenge, setHome]
  );

  // Opened from a challenge link (web): straight into that hunt
  const launched = useRef(false);
  useEffect(() => {
    if (launched.current) return;
    launched.current = true;
    const code = takeLaunchCode();
    const challenge = code ? parseChallenge(code) : null;
    if (challenge) playChallenge(challenge);
  }, [playChallenge]);

  const leaveToHome = useCallback(() => {
    leaveSpecial();
    setHome(true);
  }, [leaveSpecial, setHome]);

  const share = useShare();
  const solvedChallenge = useMemo(
    () => (c.isCompleted && mode.kind !== 'daily' ? challengeMessage(page, nav.seed, timeTaken) : null),
    [c.isCompleted, mode.kind, page, nav.seed, timeTaken]
  );

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
        huntLabel={mode.kind === 'daily' ? 'Trang của ngày' : mode.kind === 'challenge' ? 'Thử thách' : undefined}
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
          onTurnComplete={nav.completeTurn}
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

      {home && (
        <HomeScreen
          key={homeKey}
          current={ref}
          isNight={isNight}
          returning={progress.lastPage() !== undefined}
          soundEnabled={soundEnabled}
          onPlay={play}
          onSelect={selectPage}
          onOpenIndex={openIndex}
          onOpenAlbum={openAlbum}
          onToggleSound={toggleSound}
          daily={daily}
          onOpenDaily={openDaily}
          onOpenPassport={openPassport}
          onOpenCover={openCover}
          onEnterChallenge={enterChallenge}
          onOpenBackup={openBackup}
        />
      )}

      {showIndex && (
        <PageIndex
          country={country}
          current={ref}
          isNight={isNight}
          onSelect={selectPage}
          onOpenDeduction={openDeduction}
          onClose={() => setShowIndex(false)}
        />
      )}

      {showAlbum && <CreatureAlbum pages={albumPages} onClose={() => setShowAlbum(false)} />}

      {deduction && <Deduction chapter={deduction.chapter} chapterNumber={deduction.number} onClose={() => setDeduction(null)} />}

      {sheet === 'passport' && <Passport today={today} canPlayToday={daily === 'open'} onPlayDaily={openDaily} onClose={closeSheet} />}

      {sheet === 'cover' && <MyCover onClose={closeSheet} />}

      {sheet === 'challenge' && <ChallengeEntry onPlay={playChallenge} onClose={closeSheet} />}

      {sheet === 'backup' && <Backup onRestored={restored} onClose={closeSheet} />}

      {/* The case file and the night intro wait for the player to leave the home screen */}
      {!home && showPrologue && (
        <StoryPrologue chapter={ref.chapter} chapterNumber={ref.chapterNumber} onStartGame={() => setShowPrologue(false)} />
      )}

      {!home && !showPrologue && nightIntroOpen && (
        <StoryPrologue
          chapter={ref.chapter}
          chapterNumber={ref.chapterNumber}
          nightPage={page}
          onStartGame={() => setShowNightIntro(false)}
        />
      )}

      {!home && c.isPaused && !showPrologue && (
        <PauseMenu
          page={page}
          soundEnabled={soundEnabled}
          onResume={togglePause}
          onRestart={nav.replay}
          onToggleSound={toggleSound}
          onExit={() => {
            // Back to the home screen; the clock stays stopped while it is open, and "Chơi tiếp"
            // carries on with this case where it was
            togglePause();
            setHome(true);
          }}
        />
      )}

      {/* Both close as soon as a page starts turning, so the turn shows */}
      {!home && c.isGameOver && !c.isCompleted && !isTurning && (
        <TimeUpScreen page={page} foundIds={c.foundItems} onReplay={nav.replay} onOpenIndex={openIndex} />
      )}

      {askToRotate && <RotatePrompt onKeepPortrait={() => setKeepPortrait(true)} />}

      {!home && mode.kind === 'daily' && c.isCompleted && !isTurning && (
        <DailyDone
          pageTitle={page.title}
          country={country.name}
          day={mode.puzzle.day}
          timeTaken={timeTaken}
          share={{
            busy: share.busy,
            note: share.note,
            onPostcard: () => {
              const shared = dailyShare(page, mode.puzzle.day, timeTaken);
              share.sharePostcard(shared.postcard, shared.text);
            },
          }}
          onOpenPassport={openPassport}
          onHome={leaveToHome}
        />
      )}

      {!home && mode.kind !== 'daily' && c.isCompleted && !c.isExploring && !isTurning && (
        <VictoryScreen
          page={page}
          score={c.score}
          stars={stars}
          timeBonus={timeBonus}
          timeTaken={timeTaken}
          mistakes={c.mistakes}
          hintsUsed={c.hintsUsed}
          isSecretFound={c.secretFound}
          foundIds={c.foundItems}
          hasNextPage={ref.index < pages.length - 1}
          nightUnlocked={kase.unlockedNight ?? undefined}
          rivalTime={mode.kind === 'challenge' ? mode.challenge.time : undefined}
          share={
            solvedChallenge
              ? {
                  busy: share.busy,
                  note: share.note,
                  code: solvedChallenge.code,
                  onPostcard: () =>
                    share.sharePostcard(
                      victoryPostcard(page, { foundIds: c.foundItems, score: c.score, stars, time: timeTaken, code: solvedChallenge.code }),
                      postcardMessage(page, solvedChallenge.text)
                    ),
                  onChallenge: () => share.shareMessage(solvedChallenge.text),
                }
              : undefined
          }
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
