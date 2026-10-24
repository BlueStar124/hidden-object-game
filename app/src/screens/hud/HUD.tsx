import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Page } from '../../core/model';
import { colors, fonts } from '../../ui/theme';
import { ExploreStatus } from './ExploreStatus';
import { BrandLogo } from './BrandLogo';
import { HudTimer } from './HudTimer';
import { ComboBadge } from './ComboBadge';
import { PageSwitcher } from './PageSwitcher';
import { ScoreBox } from './ScoreBox';
import { HudActions } from './HudActions';
import { NightBadge } from './NightBadge';

export type HudLayout = 'phone' | 'phoneLandscape' | 'wide';

export interface HUDProps {
  layout: HudLayout;
  page: Page;
  chapterNumber: number;
  pageIndex: number; // position in the country's book (0-based)
  pageCount: number;
  /** A hunt beside the book (daily page, challenge): shown instead of the page number, no arrows */
  huntLabel?: string;
  score: number;
  remainingTime: number;
  combo: number;
  comboTimer: number;
  soundEnabled: boolean;
  isNight: boolean;
  freeHintAvailable?: boolean;
  hasNextUnlocked?: boolean;
  topInset: number;
  insetLeft: number;
  insetRight: number;
  exploreRemaining: number | null;
  onFinishExplore: () => void;
  onOpenIndex: () => void;
  onOpenAlbum: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleSound: () => void;
  onUseHint: () => void;
  onPause: () => void;
  onHome: () => void;
}

/** The bar over the sketchbook. From second to second only the clock (score, combo) changes. */
export const HUD: React.FC<HUDProps> = (props) => {
  const {
    layout,
    page,
    chapterNumber,
    score,
    remainingTime,
    combo,
    comboTimer,
    soundEnabled,
    isNight,
    topInset,
    insetLeft,
    insetRight,
    freeHintAvailable,
  } = props;
  const { width } = useWindowDimensions();
  const wide = layout === 'wide';
  const exploring = props.exploreRemaining !== null;
  const exploration =
    props.exploreRemaining !== null ? (
      <ExploreStatus remaining={props.exploreRemaining} onFinish={props.onFinishExplore} />
    ) : null;

  // Responsive breakpoints when layout is 'wide' (desktop, laptop, tablet, resized web window)
  const isCompactDesktop = wide && width < 1200;
  const isMediumDesktop = wide && width < 1060;
  const isNarrowDesktop = wide && width < 940;
  const isVeryNarrow = wide && width < 820;

  const brandMode: 'full' | 'titleOnly' | 'compact' =
    !wide || isNarrowDesktop ? 'compact' : isCompactDesktop ? 'titleOnly' : 'full';

  const showAlbumLabel = wide && !isMediumDesktop;
  const showHintLabel = wide && !isNarrowDesktop;
  const hintLabel = showHintLabel
    ? width >= 1220 && freeHintAvailable
      ? 'Gợi Ý (Miễn phí)'
      : 'Gợi Ý'
    : undefined;
  const compactBtn = !wide || isNarrowDesktop;

  const timerCompact = !wide || isNarrowDesktop;
  const timerMedium = wide && isMediumDesktop && !timerCompact;

  const scoreLabelText = wide && !isMediumDesktop ? 'ĐIỂM ĐIỀU TRA' : 'ĐIỂM';
  const isNarrowScore = !wide || isNarrowDesktop;

  const actions = (
    <HudActions
      wide={wide}
      freeHintAvailable={freeHintAvailable}
      soundEnabled={soundEnabled}
      compactBtn={compactBtn}
      showAlbumLabel={showAlbumLabel}
      hintLabel={hintLabel}
      showHintLabel={showHintLabel}
      onOpenAlbum={props.onOpenAlbum}
      onToggleSound={props.onToggleSound}
      onUseHint={props.onUseHint}
      onPause={props.onPause}
    />
  );

  const switcher = (
    <PageSwitcher
      pageIndex={props.pageIndex}
      pageCount={props.pageCount}
      huntLabel={props.huntLabel}
      hasNextUnlocked={props.hasNextUnlocked}
      onPrevPage={props.onPrevPage}
      onNextPage={props.onNextPage}
      onOpenIndex={props.onOpenIndex}
    />
  );

  const scoreBox = (
    <ScoreBox
      score={score}
      wide={wide}
      isNarrowScore={isNarrowScore}
      isNight={isNight}
      scoreLabelText={scoreLabelText}
    />
  );

  const container = [
    styles.container,
    {
      paddingTop: topInset + (wide ? 10 : 6),
      paddingLeft: insetLeft + 10,
      paddingRight: insetRight + 10,
    },
  ];
  const background = (
    <LinearGradient
      colors={
        isNight
          ? ['rgba(27, 36, 64, 0.97)', 'rgba(27, 36, 64, 0.9)']
          : ['rgba(240, 236, 226, 0.97)', 'rgba(240, 236, 226, 0.9)']
      }
      style={StyleSheet.absoluteFill}
    />
  );

  if (layout === 'phoneLandscape') {
    return (
      <View style={[container, styles.row, { paddingBottom: 5 }]}>
        {background}
        <BrandLogo onPress={props.onHome} mode="compact" isNight={isNight} />
        {switcher}
        {isNight && <NightBadge />}
        {exploring ? (
          exploration
        ) : (
          <>
            <Text
              style={[
                styles.title,
                styles.titleCompact,
                { flex: 1 },
                isNight && styles.titleNight,
              ]}
              numberOfLines={1}
            >
              {page.title}
            </Text>
            <HudTimer
              remaining={remainingTime}
              limit={page.timeLimit}
              compact
              isNight={isNight}
            />
            {combo > 1 && <ComboBadge combo={combo} comboTimer={comboTimer} compact />}
            {scoreBox}
          </>
        )}
        {actions}
      </View>
    );
  }

  if (layout === 'phone') {
    return (
      <View style={[container, { paddingBottom: 6, gap: 6 }]}>
        {background}
        <View style={styles.row}>
          <BrandLogo onPress={props.onHome} mode="compact" isNight={isNight} />
          {switcher}
          <Text
            style={[
              styles.title,
              styles.titleCompact,
              { flex: 1 },
              isNight && styles.titleNight,
            ]}
            numberOfLines={1}
          >
            {page.title}
          </Text>
          {isNight && <NightBadge />}
        </View>
        <View style={styles.row}>
          {exploring ? (
            exploration
          ) : (
            <>
              <HudTimer
                remaining={remainingTime}
                limit={page.timeLimit}
                compact
                isNight={isNight}
              />
              <View style={{ flex: 1 }} />
              {combo > 1 && <ComboBadge combo={combo} comboTimer={comboTimer} compact />}
              {scoreBox}
            </>
          )}
          {actions}
        </View>
      </View>
    );
  }

  const gapSize = isVeryNarrow ? 5 : isNarrowDesktop ? 6 : isCompactDesktop ? 8 : 12;
  const titleSize = isVeryNarrow ? 14.5 : isNarrowDesktop ? 15.5 : isCompactDesktop ? 17 : 19.5;
  const hideSubtitle = isNarrowDesktop;

  return (
    <View
      style={[
        container,
        styles.row,
        { paddingBottom: 10, justifyContent: 'space-between', gap: gapSize },
      ]}
    >
      {background}
      <View style={[styles.row, { flexShrink: 1, minWidth: 0, gap: gapSize }]}>
        <BrandLogo onPress={props.onHome} mode={brandMode} isNight={isNight} />
        {!isVeryNarrow && (
          <View style={[styles.headerDivider, isNight && styles.headerDividerNight]} />
        )}
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <View style={[styles.row, { marginBottom: 3, gap: 6 }]}>
            {!isVeryNarrow && (
              <View style={[styles.chapterPill, isNight && styles.chapterPillNight]}>
                <Text style={[styles.chapterText, isNight && styles.chapterTextNight]}>
                  CHƯƠNG {chapterNumber}
                </Text>
              </View>
            )}
            {switcher}
            {isNight && <NightBadge />}
          </View>
          <Text
            style={[styles.title, { fontSize: titleSize }, isNight && styles.titleNight]}
            numberOfLines={1}
          >
            {page.title}
          </Text>
          {!hideSubtitle && (
            <Text
              style={[styles.subtitle, isNight && styles.subtitleNight]}
              numberOfLines={1}
            >
              {page.subtitle}
            </Text>
          )}
        </View>
      </View>
      {exploring ? (
        exploration
      ) : (
        <HudTimer
          remaining={remainingTime}
          limit={page.timeLimit}
          compact={timerCompact}
          medium={timerMedium}
          isNight={isNight}
        />
      )}
      <View style={[styles.row, { flexShrink: 0, gap: gapSize }]}>
        {!exploring && combo > 1 && (
          <ComboBadge combo={combo} comboTimer={comboTimer} compact={isCompactDesktop} />
        )}
        {!exploring && scoreBox}
        {actions}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.hairline,
  },
  headerDividerNight: {
    backgroundColor: 'rgba(244, 236, 208, 0.2)',
  },
  chapterPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: 'rgba(154, 106, 62, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(154, 106, 62, 0.25)',
  },
  chapterPillNight: {
    backgroundColor: 'rgba(244, 213, 141, 0.12)',
    borderColor: 'rgba(244, 213, 141, 0.25)',
  },
  chapterText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.earth,
  },
  chapterTextNight: {
    color: colors.moonGold,
  },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: 19.5,
    color: colors.ink,
  },
  titleCompact: {
    fontSize: 15.5,
  },
  titleNight: {
    color: colors.moonlight,
  },
  subtitle: {
    fontSize: 12,
    color: '#6D6255',
    letterSpacing: 0.2,
  },
  subtitleNight: {
    color: 'rgba(244, 236, 208, 0.65)',
  },
});
