import { useEffect, useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppShell } from '../../App';
import { allPages, FIRST_COUNTRY, pagesOf } from '../../src/content';
import { isMainObject, type Page } from '../../src/core/model';
import { CreatureAlbum } from '../../src/screens/dialogs/CreatureAlbum';
import { PageIndex } from '../../src/screens/dialogs/PageIndex';
import { PauseMenu } from '../../src/screens/dialogs/PauseMenu';
import { RotatePrompt } from '../../src/screens/dialogs/RotatePrompt';
import { StoryPrologue } from '../../src/screens/dialogs/StoryPrologue';
import { TimeUpScreen } from '../../src/screens/dialogs/TimeUpScreen';
import { VictoryScreen } from '../../src/screens/dialogs/VictoryScreen';
import { GameScreen } from '../../src/screens/GameScreen';
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

const victory = (page: Page, foundIds: string[], nightUnlocked?: string) => (
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
  timeup: () => <TimeUpScreen page={pages[4].day} foundIds={pages[4].day.objects.slice(0, 3).map((o) => o.id)} onReplay={nothing} onOpenIndex={nothing} />,
  pause: () => <PauseMenu page={pages[1].day} soundEnabled onResume={nothing} onRestart={nothing} onToggleSound={nothing} onExit={nothing} />,
  prologue: () => <StoryPrologue chapter={pages[0].chapter} chapterNumber={1} onStartGame={nothing} />,
  'night-intro': () => <StoryPrologue chapter={withNight.chapter} chapterNumber={withNight.chapterNumber} nightPage={withNight.night} onStartGame={nothing} />,
  rotate: () => <RotatePrompt onKeepPortrait={nothing} />,
  index: () => <PageIndex country={FIRST_COUNTRY} current={pages[0]} isNight={false} onSelect={nothing} onClose={nothing} />,
  album: () => <CreatureAlbum pages={allPages()} onClose={nothing} />,
};

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
  const screen = SCREENS[hash];
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
