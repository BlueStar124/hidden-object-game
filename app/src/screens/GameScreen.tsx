import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { leftovers } from '../core/caseFile';
import { dailyPuzzle } from '../core/daily';
import type { Chapter, Page } from '../core/model';
import { progress } from '../core/progress';
import { localDay } from '../core/random';
import { completionBonus } from '../core/scoring';
import { allPages, story } from '../content';
import { useGame } from '../game/useGame';
import { sound } from '../platform/sound';
import { useStableCallback } from '../ui/useStableCallback';
import { colors } from '../ui/theme';
import { Desk } from './Desk';
import { GameDialogOverlays, type Sheet } from './GameDialogOverlays';
import { GamePlayArea } from './GamePlayArea';
import { HomeScreen } from './home/HomeScreen';
import { FloatingScores } from './hud/FloatingScores';
import { HUD, type HudLayout } from './hud/HUD';
import { useShare } from './share/useShare';
import { useDeviceBehaviour } from './useDeviceBehaviour';
import { useAuth } from './auth/AuthContext';
import { useChallenges } from './useChallenges';

/**
 * The one screen of the game: the desk with the sketchbook (Board), the HUD above it, the clue
 * cards below, the home screen over them when the game opens, and the dialogs (story, pause,
 * victory, index, album) over everything.
 */
export const GameScreen: React.FC = () => {
  const { userId, email: accountEmail, name: accountName, editName, openAccount, signOut } =
    useAuth();
  const [showIndex, setShowIndex] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [deduction, setDeduction] = useState<{ chapter: Chapter; number: number } | null>(null);
  const [finale, setFinale] = useState(false);
  const browsing = showIndex || showAlbum || sheet !== null || deduction !== null || finale;
  const { nav, case: kase, notices, soundEnabled, toggleSound, home, setHome } = useGame({
    browsing,
  });
  const onSignOut = useCallback(() => {
    void signOut().catch(() => {});
  }, [signOut]);
  const {
    country,
    pages,
    ref,
    page,
    isNight,
    turn,
    mode,
    showPrologue,
    setShowPrologue,
    showNightIntro,
    setShowNightIntro,
  } = nav;
  const c = kase.state;
  const isTurning = turn !== null;

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // The apps are locked to landscape; an upright phone browser is asked to turn sideways
  const [keepPortrait, setKeepPortrait] = useState(false);
  const askToRotate = Platform.OS === 'web' && height > width && width < 700 && !keepPortrait;
  const isLandscape = width >= height;
  const isPortrait = height > width && width < 700 && keepPortrait;
  const isPhoneLandscape = isLandscape && width < 1000 && height <= 450;
  const isTabletLandscape = isLandscape && width >= 960 && width < 1200 && height > 450;
  const layout: HudLayout = isPhoneLandscape
    ? 'phoneLandscape'
    : isLandscape && (width >= 1000 || height > 450)
    ? 'wide'
    : 'phone';

  // Responsive sidebar width (clue column)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const onToggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);
  const availWidth = width - insets.left - insets.right;
  const sidebarWidth = useMemo(() => {
    if (isPhoneLandscape) {
      return Math.min(260, Math.max(220, Math.round(availWidth * 0.32)));
    }
    if (availWidth < 900) {
      return Math.min(260, Math.max(210, Math.round(availWidth * 0.28)));
    }
    if (availWidth < 1100 || isTabletLandscape) {
      return Math.min(290, Math.max(250, Math.round(availWidth * 0.26)));
    }
    return Math.min(360, Math.max(300, Math.round(availWidth * 0.25)));
  }, [isPhoneLandscape, isTabletLandscape, availWidth]);
  const effectiveSidebarWidth = sidebarCollapsed ? 56 : sidebarWidth;

  // Zoom control state shared between Board and QuestPanel
  const [zoom, setZoom] = useState(1);
  const stepZoomRef = useRef<((dir: 1 | -1) => void) | null>(null);
  const onStepZoom = useCallback((dir: 1 | -1) => {
    stepZoomRef.current?.(dir);
  }, []);

  const rootRef = useRef<View>(null);
  const [rootOffset, setRootOffset] = useState({ x: 0, y: 0 });

  /* ------------------------------- Derived state ------------------------------- */

  // The pages either side are prepared while this one is played, so turning to them is instant
  const nextDay = pages[ref.index + 1]?.day;
  const backDay = isNight ? ref.day : pages[ref.index - 1]?.day;
  const { preparedPage } = nav;
  const preload = useMemo(() => {
    const target = turn
      ? pages.findIndex((p) => p.day.id === turn.to.id || p.night?.id === turn.to.id)
      : -1;
    const ahead = turn && target >= 0 ? pages[target + turn.direction]?.day : undefined;
    return [nextDay, backDay, ahead]
      .filter((p, i, all): p is Page => !!p && all.indexOf(p) === i)
      .map(preparedPage);
  }, [nextDay, backDay, pages, turn, preparedPage]);

  const albumPages = useMemo(() => allPages(), []);
  const hint = c.activeHint;
  const radarTargetId = hint?.radarPoint ? hint.objectId : null;
  const nudgeTarget = useMemo(
    () => (hint?.level === 2 ? page.objects.find((o) => o.id === hint.objectId) ?? null : null),
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

  const today = localDay(new Date());
  const dayPages = useMemo(() => allPages().filter((p) => !p.isNight), []);
  const puzzle = useMemo(() => dailyPuzzle(today, dayPages), [today, dayPages]);
  const daily = !puzzle ? 'none' : progress.stamps()[today] ? 'done' : 'open';

  const boardActive =
    !home &&
    !browsing &&
    !showPrologue &&
    !nightIntroOpen &&
    !c.isPaused &&
    !(c.isGameOver && !c.isCompleted) &&
    !(c.isCompleted && !c.isExploring) &&
    !askToRotate;

  const playing =
    !home && !c.isPaused && !c.isCompleted && !c.isGameOver && !showPrologue && !nightIntroOpen;

  /* ------------------------------ Device & feedback ------------------------------ */

  useEffect(() => {
    sound.prepareVoices(page.objects.map((o) => o.spriteType));
  }, [page]);

  const closeTopSheet = useCallback(() => {
    if (finale) setFinale(false);
    else if (deduction) setDeduction(null);
    else if (sheet) setSheet(null);
    else if (showAlbum) setShowAlbum(false);
    else if (showIndex) setShowIndex(false);
    else return false;
    return true;
  }, [finale, deduction, sheet, showAlbum, showIndex]);
  useDeviceBehaviour({ playing, paused: c.isPaused, onPause: togglePause, closeTopSheet });

  // Screen shake on a wrong guess
  const shake = useSharedValue(0);
  useEffect(() => {
    if (!kase.screenShake) return;
    const step = (x: number) => withTiming(x, { duration: 35 });
    shake.value = withSequence(
      step(-2),
      step(3),
      step(-5),
      step(5),
      step(-5),
      step(5),
      step(-5),
      step(3),
      step(-2),
      step(0)
    );
  }, [kase.screenShake, shake]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const openIndex = useCallback(() => setShowIndex(true), []);
  const openAlbum = useCallback(() => setShowAlbum(true), []);
  const requestHint = useStableCallback((id?: string) =>
    kase.requestHint(id, { x: width / 2, y: height / 2 })
  );
  const hintButton = useCallback(() => requestHint(), [requestHint]);
  const inspect = useStableCallback(kase.inspect);

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

  const { openDaily: openDailyPage, leaveSpecial } = nav;
  const openPassport = useCallback(() => setSheet('passport'), []);
  const openCover = useCallback(() => setSheet('cover'), []);
  const [coverStickers, setCoverStickers] = useState(() => progress.cover());
  const closeCover = useCallback(() => {
    setSheet(null);
    setCoverStickers(progress.cover());
  }, []);
  const openBackup = useCallback(() => setSheet('backup'), []);
  const [homeKey, setHomeKey] = useState(0);
  const restored = useCallback(() => {
    setHomeKey((k) => k + 1);
    setCoverStickers(progress.cover());
  }, []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const openDeduction = useCallback(
    (ch: Chapter, number: number) => setDeduction({ chapter: ch, number }),
    []
  );

  const openDaily = useCallback(() => {
    if (!puzzle || !openDailyPage(puzzle)) return;
    setSheet(null);
    setHome(false);
  }, [puzzle, openDailyPage, setHome]);

  const challengeOpened = useCallback(() => {
    setSheet(null);
    setShowIndex(false);
    setHome(false);
  }, [setHome]);
  const showChallengeSheet = useCallback(() => setSheet('challenge'), []);
  const challenges = useChallenges({
    nav,
    page,
    completed: c.isCompleted,
    timeTaken,
    signedIn: !!accountEmail,
    onOpened: challengeOpened,
    showSheet: showChallengeSheet,
  });
  const {
    draft: challengeDraft,
    enter: enterChallenge,
    play: playChallenge,
    playFriend: playFriendChallenge,
    solved: solvedChallenge,
  } = challenges;

  const leaveToHome = useCallback(() => {
    leaveSpecial();
    setHome(true);
  }, [leaveSpecial, setHome]);

  const share = useShare();

  const measureRoot = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => setRootOffset({ x, y }));
  }, []);

  /* ----------------------------------- Render ----------------------------------- */

  return (
    <Animated.View ref={rootRef} style={[styles.root, shakeStyle]} onLayout={measureRoot}>
      <StatusBar hidden style={isNight ? 'light' : 'dark'} />
      <Desk night={isNight} foliage={width > 800} stickers={coverStickers} />

      {/* Always mounted, even under the home screen: the book keeps its scenes and warmed pages,
          so "Chơi tiếp" starts at once and a turn begun from home completes (boardActive is off) */}
      <HUD
        layout={layout}
        page={page}
        chapterNumber={ref.chapterNumber}
        pageIndex={ref.index}
        pageCount={pages.length}
        huntLabel={
          mode.kind === 'daily'
            ? 'Trang của ngày'
            : mode.kind === 'challenge'
            ? 'Thử thách'
            : undefined
        }
        score={c.score}
        remainingTime={c.remainingTime}
        combo={c.combo}
        comboTimer={c.comboTimer}
        soundEnabled={soundEnabled}
        isNight={isNight}
        freeHintAvailable={!c.freeHintUsed}
        topInset={insets.top}
        insetLeft={insets.left}
        insetRight={insets.right}
        exploreRemaining={c.isCompleted && c.isExploring ? left : null}
        onFinishExplore={finishExplore}
        onOpenIndex={openIndex}
        onOpenAlbum={openAlbum}
        onPrevPage={nav.prev}
        onNextPage={nav.next}
        hasNextUnlocked={
          mode.kind === 'book'
            ? Boolean(nav.nextPage && story.isUnlocked(nav.nextPage.id))
            : ref.index < pages.length - 1
        }
        onToggleSound={toggleSound}
        onUseHint={hintButton}
        onPause={togglePause}
        onHome={leaveToHome}
      />

      <GamePlayArea
        isPortrait={isPortrait}
        layout={layout}
        page={page}
        caseState={c}
        radarTargetId={radarTargetId}
        nudgeTarget={nudgeTarget}
        turn={turn}
        onTurnComplete={nav.completeTurn}
        isFogged={kase.isFogged}
        onInspect={inspect}
        preload={preload}
        boardActive={boardActive}
        zoom={zoom}
        setZoom={setZoom}
        stepZoomRef={stepZoomRef}
        onStepZoom={onStepZoom}
        hint={hint}
        hintRefusal={kase.hintRefusal}
        requestHint={requestHint}
        insets={insets}
        isTurning={isTurning}
        sidebarCollapsed={sidebarCollapsed}
        effectiveSidebarWidth={effectiveSidebarWidth}
        onToggleSidebar={onToggleSidebar}
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
          userId={userId}
          accountEmail={accountEmail}
          accountName={accountName}
          onEditName={editName}
          onSignIn={openAccount}
          onSignOut={onSignOut}
        />
      )}

      <GameDialogOverlays
        home={home}
        setHome={setHome}
        leaveToHome={leaveToHome}
        showIndex={showIndex}
        setShowIndex={setShowIndex}
        showAlbum={showAlbum}
        setShowAlbum={setShowAlbum}
        albumPages={albumPages}
        sheet={sheet}
        closeSheet={closeSheet}
        closeCover={closeCover}
        restored={restored}
        deduction={deduction}
        setDeduction={setDeduction}
        finale={finale}
        setFinale={setFinale}
        showPrologue={showPrologue}
        setShowPrologue={setShowPrologue}
        nightIntroOpen={nightIntroOpen}
        setShowNightIntro={setShowNightIntro}
        askToRotate={askToRotate}
        setKeepPortrait={setKeepPortrait}
        country={country}
        refPage={ref}
        page={page}
        pages={pages}
        isNight={isNight}
        mode={mode}
        caseState={c}
        unlockedNight={kase.unlockedNight}
        timeTaken={timeTaken}
        stars={stars}
        timeBonus={timeBonus}
        solvedChallenge={solvedChallenge}
        share={share}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        togglePause={togglePause}
        isTurning={isTurning}
        replay={nav.replay}
        next={nav.next}
        explore={explore}
        selectPage={selectPage}
        openDeduction={openDeduction}
        openIndex={openIndex}
        today={today}
        daily={daily}
        openDaily={openDaily}
        openPassport={openPassport}
        challengeDraft={challengeDraft}
        playChallenge={playChallenge}
        playFriendChallenge={playFriendChallenge}
        openAccount={openAccount}
        accountEmail={accountEmail}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    overflow: 'hidden',
  },
});
