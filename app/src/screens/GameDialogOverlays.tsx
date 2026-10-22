import React from 'react';
import type { CaseState, Chapter, Country, Page, PageRef } from '../core/model';
import { allChapters } from '../content';
import { Backup } from './dialogs/Backup';
import { ChallengeEntry } from './dialogs/ChallengeEntry';
import { CreatureAlbum } from './dialogs/CreatureAlbum';
import { DailyDone } from './dialogs/DailyDone';
import { Deduction } from './dialogs/Deduction';
import { Finale, journeyStats } from './dialogs/Finale';
import { GameVictoryModal } from './dialogs/GameVictoryModal';
import { MyCover } from './dialogs/MyCover';
import { PageIndex } from './dialogs/PageIndex';
import { Passport } from './dialogs/Passport';
import { PauseMenu } from './dialogs/PauseMenu';
import { RotatePrompt } from './dialogs/RotatePrompt';
import { StoryPrologue } from './dialogs/StoryPrologue';
import { TimeUpScreen } from './dialogs/TimeUpScreen';
import { certificateShare, dailyShare } from './share/messages';
import type { useShare } from './share/useShare';
import type { ChallengeDraft } from './useChallenges';
import type { PlayMode } from '../game/useNavigation';

export type Sheet = 'passport' | 'cover' | 'challenge' | 'backup' | null;

export interface GameDialogOverlaysProps {
  home: boolean;
  setHome: (home: boolean) => void;
  leaveToHome: () => void;
  showIndex: boolean;
  setShowIndex: (show: boolean) => void;
  showAlbum: boolean;
  setShowAlbum: (show: boolean) => void;
  albumPages: Page[];
  sheet: Sheet;
  closeSheet: () => void;
  closeCover: () => void;
  restored: () => void;
  deduction: { chapter: Chapter; number: number } | null;
  setDeduction: (d: { chapter: Chapter; number: number } | null) => void;
  finale: boolean;
  setFinale: (f: boolean) => void;
  showPrologue: boolean;
  setShowPrologue: (s: boolean) => void;
  nightIntroOpen: boolean;
  setShowNightIntro: (s: boolean) => void;
  askToRotate: boolean;
  setKeepPortrait: (k: boolean) => void;
  country: Country;
  refPage: PageRef;
  page: Page;
  pages: PageRef[];
  isNight: boolean;
  mode: PlayMode;
  caseState: CaseState;
  unlockedNight: string | null;
  timeTaken: number;
  stars: number;
  timeBonus: number;
  solvedChallenge: { code: string; text: string } | null;
  share: ReturnType<typeof useShare>;
  soundEnabled: boolean;
  toggleSound: () => void;
  togglePause: () => void;
  isTurning: boolean;
  replay: () => void;
  next: () => void;
  explore: (exploring: boolean) => void;
  selectPage: (index: number, night: boolean, countryId: string) => void;
  openDeduction: (ch: Chapter, num: number) => void;
  openIndex: () => void;
  today: string;
  daily: 'open' | 'done' | 'none';
  openDaily: () => void;
  openPassport: () => void;
  challengeDraft: ChallengeDraft | null;
  playChallenge: (c: import('../core/challenge').Challenge) => string | null;
  playFriendChallenge: (fc: import('../core/challenge').FriendChallenge) => string | null;
  openAccount: () => void;
  accountEmail: string | undefined;
}

export const GameDialogOverlays: React.FC<GameDialogOverlaysProps> = ({
  home,
  setHome,
  leaveToHome,
  showIndex,
  setShowIndex,
  showAlbum,
  setShowAlbum,
  albumPages,
  sheet,
  closeSheet,
  closeCover,
  restored,
  deduction,
  setDeduction,
  finale,
  setFinale,
  showPrologue,
  setShowPrologue,
  nightIntroOpen,
  setShowNightIntro,
  askToRotate,
  setKeepPortrait,
  country,
  refPage,
  page,
  pages,
  isNight,
  mode,
  caseState: c,
  unlockedNight,
  timeTaken,
  stars,
  timeBonus,
  solvedChallenge,
  share,
  soundEnabled,
  toggleSound,
  togglePause,
  isTurning,
  replay,
  next,
  explore,
  selectPage,
  openDeduction,
  openIndex,
  today,
  daily,
  openDaily,
  openPassport,
  challengeDraft,
  playChallenge,
  playFriendChallenge,
  openAccount,
  accountEmail,
}) => {
  return (
    <>
      {showIndex && (
        <PageIndex
          country={country}
          current={refPage}
          isNight={isNight}
          onSelect={selectPage}
          onOpenDeduction={openDeduction}
          onClose={() => setShowIndex(false)}
        />
      )}

      {showAlbum && <CreatureAlbum pages={albumPages} onClose={() => setShowAlbum(false)} />}

      {deduction && (
        <Deduction
          chapter={deduction.chapter}
          chapterNumber={deduction.number}
          onFinale={() => {
            setDeduction(null);
            setFinale(true);
          }}
          onClose={() => setDeduction(null)}
        />
      )}

      {finale && (
        <Finale
          share={{
            busy: share.busy,
            note: share.note,
            onPostcard: () => {
              const last = allChapters().find((ch) => ch.mystery?.finale);
              const meeting = last?.pages[last.pages.length - 1].day ?? page;
              const shared = certificateShare(meeting, journeyStats());
              share.sharePostcard(shared.postcard, shared.text);
            },
          }}
          onClose={() => {
            setFinale(false);
            setHome(true);
          }}
        />
      )}

      {sheet === 'passport' && (
        <Passport
          today={today}
          canPlayToday={daily === 'open'}
          onPlayDaily={openDaily}
          onClose={closeSheet}
        />
      )}

      {sheet === 'cover' && <MyCover onClose={closeCover} />}

      {sheet === 'challenge' && (
        <ChallengeEntry
          initialMode={challengeDraft ? 'receive' : 'create'}
          initialText={challengeDraft?.text}
          initialError={challengeDraft?.error}
          onPlay={playChallenge}
          onPlayFriend={playFriendChallenge}
          onClose={closeSheet}
          onSignIn={openAccount}
          signedIn={!!accountEmail}
        />
      )}

      {sheet === 'backup' && <Backup onRestored={restored} onClose={closeSheet} />}

      {!home && showPrologue && (
        <StoryPrologue
          chapter={refPage.chapter}
          chapterNumber={refPage.chapterNumber}
          onStartGame={() => setShowPrologue(false)}
        />
      )}

      {!home && !showPrologue && nightIntroOpen && (
        <StoryPrologue
          chapter={refPage.chapter}
          chapterNumber={refPage.chapterNumber}
          nightPage={page}
          onStartGame={() => setShowNightIntro(false)}
        />
      )}

      {!home && c.isPaused && !showPrologue && (
        <PauseMenu
          page={page}
          soundEnabled={soundEnabled}
          onResume={togglePause}
          onRestart={replay}
          onToggleSound={toggleSound}
          onExit={() => {
            togglePause();
            setHome(true);
          }}
        />
      )}

      {!home && c.isGameOver && !c.isCompleted && !isTurning && (
        <TimeUpScreen
          page={page}
          foundIds={c.foundItems}
          onReplay={replay}
          onOpenIndex={openIndex}
        />
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
        <GameVictoryModal
          page={page}
          country={country}
          ref={refPage}
          pages={pages}
          mode={mode}
          caseState={c}
          unlockedNight={unlockedNight}
          timeTaken={timeTaken}
          stars={stars}
          timeBonus={timeBonus}
          solvedChallenge={solvedChallenge}
          share={share}
          onNextPage={next}
          onFinale={() => setFinale(true)}
          onReplay={replay}
          onExplore={() => explore(true)}
        />
      )}
    </>
  );
};