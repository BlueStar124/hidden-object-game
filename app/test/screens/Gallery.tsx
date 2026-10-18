import { useEffect, useState, type ReactElement } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../../App';
import { allPages, FIRST_COUNTRY, pagesOf } from '../../src/content';
import { isMainObject, type Page } from '../../src/core/model';
import { Backup } from '../../src/screens/dialogs/Backup';
import { ChallengeEntry } from '../../src/screens/dialogs/ChallengeEntry';
import { CreatureAlbum } from '../../src/screens/dialogs/CreatureAlbum';
import { DailyDone } from '../../src/screens/dialogs/DailyDone';
import { Deduction } from '../../src/screens/dialogs/Deduction';
import { Finale } from '../../src/screens/dialogs/Finale';
import { MyCover } from '../../src/screens/dialogs/MyCover';
import { PageIndex } from '../../src/screens/dialogs/PageIndex';
import { Passport } from '../../src/screens/dialogs/Passport';
import { PauseMenu } from '../../src/screens/dialogs/PauseMenu';
import { RotatePrompt } from '../../src/screens/dialogs/RotatePrompt';
import { StoryPrologue } from '../../src/screens/dialogs/StoryPrologue';
import { TimeUpScreen } from '../../src/screens/dialogs/TimeUpScreen';
import { VictoryScreen } from '../../src/screens/dialogs/VictoryScreen';
import { NameDialog } from '../../src/screens/auth/NameDialog';
import { PasswordDialog } from '../../src/screens/auth/PasswordDialog';
import { GameScreen } from '../../src/screens/GameScreen';
import { victoryPostcard } from '../../src/screens/share/messages';
import { drawPostcard } from '../../src/screens/share/postcard';
import { colors } from '../../src/ui/theme';

/**
 * Every dialog with sample content — the longest it gets: every badge, every note — for the
 * screen-size tests (tools/test-screens.mjs). Only in their build (EXPO_PUBLIC_SCREEN_TESTS=1,
 * see index.web.ts). `#victory`, `#pause`… shows that dialog; no hash: the game itself.
 */

const pages = pagesOf(FIRST_COUNTRY);
const withNight = pages.find((p) => p.night)!; // a page whose victory unlocks its night
const nothing = () => {};

const found = (page: Page, { secret, critters }: { secret: boolean; critters: number }) => [
  ...page.objects.filter(isMainObject).map((o) => o.id),
  ...(secret ? page.objects.filter((o) => o.isSecret).map((o) => o.id) : []),
  ...page.objects.filter((o) => o.isBonus).slice(0, critters).map((o) => o.id),
];

// Every result offers a postcard and a challenge (the code, as long as it gets)
const share = { busy: false, note: 'Đã tải bưu thiếp về máy và chép sẵn lời nhắn.', code: 'SG12N-7K2P-1234', onPostcard: nothing, onChallenge: nothing };
// The chapter with the most clue fragments
const mysteryChapter = FIRST_COUNTRY.chapters.find((c) => c.mystery) ?? FIRST_COUNTRY.chapters[0];

const victory = (page: Page, foundIds: string[], nightUnlocked?: string, rivalTime?: number) => (
  <VictoryScreen
    page={page}
    score={4304}
    stars={3}
    timeBonus={884}
    timeTaken={19}
    mistakes={1}
    hintsUsed={0}
    isSecretFound={foundIds.some((id) => page.objects.find((o) => o.id === id)?.isSecret)}
    foundIds={foundIds}
    hasNextPage
    nightUnlocked={nightUnlocked}
    rivalTime={rivalTime}
    share={share}
    onNextPage={nothing}
    onReplay={nothing}
    onExplore={nothing}
  />
);

export const SCREENS: Record<string, () => ReactElement> = {
  // Secret found, critters still hiding ("Soi Tiếp" + the note), night unlocked: the tallest
  victory: () => victory(withNight.day, found(withNight.day, { secret: true, critters: 1 }), withNight.night!.title),
  // Everything found (as in the bug report from an iPhone held sideways)
  'victory-perfect': () => victory(pages[2].day, found(pages[2].day, { secret: true, critters: 9 })),
  // A friend's challenge: the comparison line on top of everything else
  'victory-challenge': () => victory(withNight.day, found(withNight.day, { secret: true, critters: 1 }), withNight.night!.title, 25),
  timeup: () => <TimeUpScreen page={pages[4].day} foundIds={pages[4].day.objects.slice(0, 3).map((o) => o.id)} onReplay={nothing} onOpenIndex={nothing} />,
  pause: () => (
    <PauseMenu
      page={pages[1].day}
      soundEnabled
      onResume={nothing}
      onRestart={nothing}
      onToggleSound={nothing}
      onExit={nothing}
    />
  ),
  prologue: () => <StoryPrologue chapter={pages[0].chapter} chapterNumber={1} onStartGame={nothing} />,
  'night-intro': () => <StoryPrologue chapter={withNight.chapter} chapterNumber={withNight.chapterNumber} nightPage={withNight.night} onStartGame={nothing} />,
  rotate: () => <RotatePrompt onKeepPortrait={nothing} />,
  index: () => <PageIndex country={FIRST_COUNTRY} current={pages[0]} isNight={false} onSelect={nothing} onOpenDeduction={nothing} onClose={nothing} />,
  album: () => <CreatureAlbum pages={allPages()} onClose={nothing} />,
  deduction: () => <Deduction chapter={mysteryChapter} chapterNumber={1} onFinale={nothing} onClose={nothing} />,
  finale: () => <Finale share={share} onClose={nothing} />,
  passport: () => <Passport today="2026-10-12" canPlayToday onPlayDaily={nothing} onClose={nothing} />,
  cover: () => <MyCover onClose={nothing} />,
  challenge: () => <ChallengeEntry initialMode="receive" onPlay={() => null} onClose={nothing} />,
  'challenge-create': () => <ChallengeEntry onPlay={() => null} onClose={nothing} />,
  'challenge-locked': () => <ChallengeEntry initialMode="receive" initialText="SG2N-7K2P-12345" initialError="Mã này dành cho một trang chưa có trong phiên bản game của bạn." onPlay={() => null} onClose={nothing} />,
  backup: () => <Backup onRestored={nothing} onClose={nothing} />,
  password: () => <PasswordDialog onSave={async () => null} onClose={nothing} />,
  name: () => <NameDialog initial="Thám tử Lan" required={false} onSave={async () => null} onClose={nothing} />,
  'daily-done': () => (
    <DailyDone
      pageTitle={pages[0].day.title}
      country={FIRST_COUNTRY.name}
      day="2026-10-12"
      timeTaken={142}
      share={{ busy: false, note: 'Đã tải bưu thiếp về máy và chép sẵn lời nhắn.', onPostcard: nothing }}
      onOpenPassport={nothing}
      onHome={nothing}
    />
  ),
};

/** The postcard of a page, drawn as it is shared (`#postcard`: for a look by eye, not in the checks). */
function PostcardPreview() {
  const [jpeg, setJpeg] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const page = withNight.day;
    const foundIds = found(page, { secret: true, critters: 1 });
    drawPostcard(victoryPostcard(page, { foundIds, score: 4304, stars: 3, time: 142, code: 'SG2-7K2P-142' })).then(setJpeg);
  }, []);
  if (jpeg === undefined) return <Text>Đang vẽ bưu thiếp…</Text>;
  if (jpeg === null) return <Text testID="postcard-failed">Không vẽ được bưu thiếp</Text>;
  return <Image testID="postcard" source={{ uri: `data:image/jpeg;base64,${jpeg}` }} style={{ width: 1200, height: 630 }} />;
}

function useHash() {
  const [hash, setHash] = useState(() => location.hash.slice(1));
  useEffect(() => {
    const update = () => setHash(location.hash.slice(1));
    addEventListener('hashchange', update);
    return () => removeEventListener('hashchange', update);
  }, []);
  return hash;
}

export default function Gallery() {
  const hash = useHash();
  const screen = hash === 'postcard' ? () => <PostcardPreview /> : SCREENS[hash];
  return (
    <AppShell>
      {screen ? (
        // key: a fresh dialog for each hash, entering animation included
        <View key={hash} style={styles.desk}>
          {screen()}
        </View>
      ) : (
        <GameScreen />
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  desk: {
    flex: 1,
    backgroundColor: colors.paper,
  },
});
