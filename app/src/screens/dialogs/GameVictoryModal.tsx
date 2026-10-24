import React from 'react';
import type { Country, Page, PageRef, PageSlot } from '../../core/model';
import { COUNTRIES } from '../../content';
import { postcardMessage, victoryPostcard } from '../share/messages';
import { VictoryScreen } from './VictoryScreen';

interface GameVictoryModalProps {
  page: Page;
  country: Country;
  ref: PageRef;
  pages: PageSlot[];
  mode: any;
  caseState: any;
  unlockedNight?: string | null;
  timeTaken: number;
  stars: number;
  timeBonus: number;
  solvedChallenge: any;
  share: any;
  onNextPage: () => void;
  onFinale: () => void;
  onReplay: () => void;
  onExplore: () => void;
}

export const GameVictoryModal: React.FC<GameVictoryModalProps> = React.memo((props) => {
  const {
    page,
    country,
    ref: pageRef,
    pages,
    mode,
    caseState: c,
    unlockedNight,
    timeTaken,
    stars,
    timeBonus,
    solvedChallenge,
    share,
    onNextPage,
    onFinale,
    onReplay,
    onExplore,
  } = props;

  const inBook = mode.kind === 'book';
  const isLastPageOfCountry = pageRef.index >= pages.length - 1;
  const currentCountryIdx = COUNTRIES.findIndex((x) => x.id === country.id);
  const nextCountry =
    currentCountryIdx >= 0 && currentCountryIdx < COUNTRIES.length - 1
      ? COUNTRIES[currentCountryIdx + 1]
      : null;
  const isJourneyEnd = inBook && isLastPageOfCountry && !nextCountry;
  const hasNextStoryStep = inBook
    ? pageRef.index < pages.length - 1 || nextCountry !== null
    : pageRef.index < pages.length - 1;

  let nextButtonLabel: string;
  if (isJourneyEnd) {
    nextButtonLabel = 'Hoàn Thành Hành Trình';
  } else if (inBook && isLastPageOfCountry && nextCountry) {
    nextButtonLabel = `Sang ${nextCountry.name}`;
  } else if (pageRef.index < pages.length - 1) {
    nextButtonLabel = 'Lật Trang Mới';
  } else {
    nextButtonLabel = 'Hoàn Thành Vụ Án';
  }

  return (
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
      hasNextPage={hasNextStoryStep && !isJourneyEnd}
      nextLabel={nextButtonLabel}
      nightUnlocked={unlockedNight ?? undefined}
      rivalTime={
        mode.kind === 'challenge' && !('kind' in mode.challenge)
          ? mode.challenge.time
          : undefined
      }
      share={
        solvedChallenge
          ? {
              busy: share.busy,
              note: share.note,
              code: solvedChallenge.code,
              onPostcard: () =>
                share.sharePostcard(
                  victoryPostcard(page, {
                    foundIds: c.foundItems,
                    score: c.score,
                    stars,
                    time: timeTaken,
                    code: solvedChallenge.code,
                  }),
                  postcardMessage(page, solvedChallenge.text)
                ),
              onChallenge: () => share.shareMessage(solvedChallenge.text),
            }
          : undefined
      }
      onNextPage={() => {
        if (isJourneyEnd) {
          onFinale();
        } else {
          onNextPage();
        }
      }}
      onReplay={onReplay}
      onExplore={onExplore}
    />
  );
});

