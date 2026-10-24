import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PageRef } from '../../core/model';
import { progress } from '../../core/progress';
import { COUNTRIES, story } from '../../content';
import { Lock } from '../../ui/icons';
import { colors, shadow } from '../../ui/theme';
import { BookCard } from './BookCard';
import { HomeActions } from './HomeActions';
import { HomeIntro } from './HomeIntro';
import { HomeTabs, type HomeShelfTab } from './HomeTabs';
import { LeaderboardView } from './LeaderboardView';
import { albumProgress, bookSummary } from './summary';

export interface HomeScreenProps {
  /** The page the book is open at: "Chơi tiếp" goes on there */
  current: PageRef;
  isNight: boolean;
  /** The player has been in the books before (a new one gets "Bắt đầu điều tra") */
  returning: boolean;
  soundEnabled: boolean;
  onPlay: () => void;
  /** Opens a page of a country's sketchbook (its index), as the page index does */
  onSelect: (index: number, night: boolean, countryId: string) => void;
  onOpenIndex: () => void;
  onOpenAlbum: () => void;
  onToggleSound: () => void;
  /** Today's daily page: there to play, already done, or none (no page has room for one) */
  daily: 'open' | 'done' | 'none';
  onOpenDaily: () => void;
  onOpenPassport: () => void;
  onOpenCover: () => void;
  onEnterChallenge: () => void;
  onOpenBackup: () => void;
  userId?: string | null;
  accountEmail: string;
  /** The name in the game (core/profile), shown instead of the email once there is one */
  accountName: string | null;
  onEditName: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

/**
 * The home screen, over the sketchbook when the game opens (and from the pause menu): carry on
 * where the player left off, pick a country's sketchbook, or browse the index and the album. The
 * book is laid out underneath meanwhile, so playing starts at once.
 */
export const HomeScreen = React.memo<HomeScreenProps>(
  ({
    current,
    isNight,
    returning,
    soundEnabled,
    onPlay,
    onSelect,
    onOpenIndex,
    onOpenAlbum,
    onToggleSound,
    daily,
    onOpenDaily,
    onOpenPassport,
    onOpenCover,
    onEnterChallenge,
    onOpenBackup,
    userId,
    accountEmail,
    accountName,
    onEditName,
    onSignIn,
    onSignOut,
  }) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [notice, setNotice] = useState<string | null>(null);
    const [shelfTab, setShelfTab] = useState<HomeShelfTab>('books');
    const journeyDone = useMemo(() => story.isJourneyCompleted(), []);

    // Side by side unless the screen is narrow (a phone held upright); little height: tighter
    const columns = width >= 600;
    const tight = height < 420;
    const pad = tight ? 10 : 18;
    const available = height - insets.top - insets.bottom - 2 * pad;

    // Read once each time the home screen opens: progress only changes while playing
    const books = useMemo(() => COUNTRIES.map(bookSummary), []);
    const album = useMemo(() => albumProgress(), []);
    const score = useMemo(() => progress.totalScore(), []);
    const cleared = books.reduce((n, b) => n + b.cleared, 0);
    const pageCount = books.reduce((n, b) => n + b.pages, 0);

    const noticePill = notice ? (
      <Pressable onPress={() => setNotice(null)} style={styles.noticeBanner} accessibilityRole="alert">
        <Lock size={14} color="#b45309" />
        <Text style={styles.noticeText}>{notice}</Text>
        <Text style={styles.noticeClose}>✕</Text>
      </Pressable>
    ) : null;

    const cards = books.map((book) => (
      <BookCard
        key={book.country.id}
        book={book}
        here={book.country.id === current.country.id}
        thumbWidth={tight ? 100 : 128}
        onPress={onSelect}
        onLockedPress={(reason) => setNotice(reason)}
      />
    ));

    const intro = <HomeIntro columns={columns} tight={tight} />;

    const actions = (
      <HomeActions
        current={current}
        isNight={isNight}
        returning={returning}
        soundEnabled={soundEnabled}
        journeyDone={journeyDone}
        score={score}
        cleared={cleared}
        pageCount={pageCount}
        album={album}
        daily={daily}
        accountEmail={accountEmail}
        accountName={accountName}
        columns={columns}
        tight={tight}
        onPlay={onPlay}
        onOpenIndex={onOpenIndex}
        onOpenAlbum={onOpenAlbum}
        onOpenBackup={onOpenBackup}
        onToggleSound={onToggleSound}
        onOpenDaily={onOpenDaily}
        onOpenPassport={onOpenPassport}
        onOpenCover={onOpenCover}
        onEnterChallenge={onEnterChallenge}
        onEditName={onEditName}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />
    );

    const shelfHeader = <HomeTabs activeTab={shelfTab} onSelectTab={setShelfTab} />;

    return (
      <Animated.View
        entering={FadeIn.duration(250)}
        style={[
          StyleSheet.absoluteFill,
          styles.root,
          {
            paddingTop: insets.top + pad,
            paddingBottom: insets.bottom + pad,
            paddingLeft: insets.left + pad,
            paddingRight: insets.right + pad,
          },
        ]}
      >
        <LinearGradient
          colors={isNight ? NIGHT_HOME_WASH : HOME_WASH}
          locations={WASH_STOPS}
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={StyleSheet.absoluteFill} accessible={false} />

        {columns ? (
          <View style={[styles.columns, tight && styles.columnsTight]}>
            <View style={styles.left}>
              {intro}
              {actions}
            </View>
            <View style={[styles.shelf, styles.shelfSide, { maxHeight: available }]}>
              {shelfHeader}
              {shelfTab === 'books' ? (
                <ScrollView
                  style={styles.shelfScroll}
                  contentContainerStyle={styles.shelfList}
                  showsVerticalScrollIndicator={false}
                >
                  {noticePill}
                  {cards}
                </ScrollView>
              ) : (
                <LeaderboardView currentUserId={userId} onSignIn={onSignIn} tight={tight} />
              )}
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.stackScroll}
            contentContainerStyle={styles.stack}
            showsVerticalScrollIndicator={false}
          >
            {intro}
            {actions}
            <View style={styles.shelf}>
              {shelfHeader}
              {shelfTab === 'books' ? (
                <View style={styles.shelfList}>
                  {noticePill}
                  {cards}
                </View>
              ) : (
                <LeaderboardView currentUserId={userId} onSignIn={onSignIn} tight={tight} />
              )}
            </View>
          </ScrollView>
        )}
      </Animated.View>
    );
  }
);

const HOME_WASH = ['#ECE7DC', '#F3EFE6', '#F3EFE6', '#ECE7DC'] as const;
const NIGHT_HOME_WASH = ['#1a1d2e', '#161926', '#161926', '#1a1d2e'] as const;
const WASH_STOPS = [0, 0.25, 0.75, 1] as const;

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.paper,
    zIndex: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columns: {
    width: '100%',
    maxWidth: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  columnsTight: {
    gap: 18,
  },
  left: {
    flex: 1,
    maxWidth: 430,
  },
  stackScroll: {
    alignSelf: 'stretch',
  },
  stack: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 4,
  },
  shelf: {
    backgroundColor: colors.paperCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    ...shadow(18, 0.12, 8),
  },
  shelfSide: {
    flex: 1.15,
  },
  shelfScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  shelfList: {
    padding: 10,
    gap: 10,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  noticeClose: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '700',
    paddingLeft: 4,
  },
});
