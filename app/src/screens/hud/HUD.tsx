import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  BookHeart,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleQuestionMark,
  Flame,
  Moon,
  Pause,
  Volume2,
  VolumeX,
} from '../../ui/icons';
import type { Page } from '../../core/model';
import { formatClock, formatNumber } from '../../ui/format';
import { colors, fonts, gradients } from '../../ui/theme';

export type HudLayout = 'phone' | 'phoneLandscape' | 'wide';

interface HUDProps {
  layout: HudLayout;
  page: Page;
  chapterNumber: number;
  pageIndex: number; // position in the country's book (0-based)
  pageCount: number;
  score: number;
  remainingTime: number;
  combo: number;
  comboTimer: number;
  soundEnabled: boolean;
  isNight: boolean;
  topInset: number;
  insetLeft: number;
  insetRight: number;
  onOpenIndex: () => void;
  onOpenAlbum: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleSound: () => void;
  onUseHint: () => void;
  onPause: () => void;
}

const IconButton: React.FC<{
  onPress: () => void;
  label: string;
  showLabel?: boolean;
  tone?: 'default' | 'hint' | 'album';
  children: React.ReactNode;
}> = ({ onPress, label, showLabel, tone = 'default', children }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    hitSlop={4}
    style={({ pressed }) => [
      styles.btn,
      tone === 'hint' && styles.btnHint,
      tone === 'album' && styles.btnAlbum,
      pressed && styles.btnPressed,
    ]}
  >
    {children}
    {showLabel && (
      <Text style={[styles.btnText, tone === 'hint' && { color: colors.earth }, tone === 'album' && { color: colors.emerald }]}>
        {label}
      </Text>
    )}
  </Pressable>
);

const PageSwitcher: React.FC<
  Pick<HUDProps, 'pageIndex' | 'pageCount' | 'onPrevPage' | 'onNextPage' | 'onOpenIndex'>
> = ({ pageIndex, pageCount, onPrevPage, onNextPage, onOpenIndex }) => (
  <View style={styles.switcher}>
    <Pressable
      onPress={onPrevPage}
      disabled={pageIndex <= 0}
      hitSlop={8}
      accessibilityLabel="Lật về trang trước"
      style={[styles.arrow, pageIndex <= 0 && styles.disabled]}
    >
      <ChevronLeft size={16} color={colors.inkSoft} />
    </Pressable>
    <Pressable onPress={onOpenIndex} hitSlop={6} accessibilityLabel="Mục lục các trang ký họa" style={styles.picker}>
      <BookOpen size={13} color={colors.ink} />
      <Text style={styles.pickerText}>
        Trang {pageIndex + 1} / {pageCount}
      </Text>
      <Text style={styles.caret}>▾</Text>
    </Pressable>
    <Pressable
      onPress={onNextPage}
      disabled={pageIndex >= pageCount - 1}
      hitSlop={8}
      accessibilityLabel="Lật sang trang sau"
      style={[styles.arrow, pageIndex >= pageCount - 1 && styles.disabled]}
    >
      <ChevronRight size={16} color={colors.inkSoft} />
    </Pressable>
  </View>
);

const NightBadge = () => (
  <View style={styles.nightBadge}>
    <Moon size={11} color={colors.moonGold} />
    <Text style={styles.nightText}>ĐÊM</Text>
  </View>
);

/** Countdown with its bar; turns red and pulses in the last 30 seconds. */
const Timer: React.FC<{ remaining: number; limit: number; compact: boolean }> = ({ remaining, limit, compact }) => {
  const low = remaining <= 30;
  const pulse = useSharedValue(1);
  const fill = useSharedValue(Math.min(1, remaining / Math.max(1, limit)));

  useEffect(() => {
    fill.value = withTiming(Math.min(1, remaining / Math.max(1, limit)), { duration: 300, easing: Easing.linear });
  }, [remaining, limit, fill]);

  useEffect(() => {
    if (low) {
      pulse.value = withRepeat(withSequence(withTiming(1.03, { duration: 500 }), withTiming(0.97, { duration: 500 })), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
  }, [low, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: low ? 0.7 + (pulse.value - 0.97) * 5 : 1,
  }));
  const barStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  if (compact) {
    return (
      <View style={styles.timerPill}>
        <Animated.Text style={[styles.timerSmall, low && styles.timerLow, pulseStyle]}>{formatClock(remaining)}</Animated.Text>
        <View style={[styles.barTrack, { width: 40, marginTop: 0 }]}>
          <Animated.View style={[styles.barFill, low && { backgroundColor: colors.danger }, barStyle]} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.timer}>
      <Text style={styles.metaLabel}>THỜI GIAN CÒN LẠI</Text>
      <Animated.Text style={[styles.timerBig, low && styles.timerLow, pulseStyle]}>{formatClock(remaining)}</Animated.Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, low && { backgroundColor: colors.danger }, barStyle]} />
      </View>
    </View>
  );
};

const ComboBadge: React.FC<{ combo: number; comboTimer: number; compact: boolean }> = ({ combo, comboTimer, compact }) => {
  const wiggle = useSharedValue(-8);
  useEffect(() => {
    wiggle.value = withRepeat(withTiming(8, { duration: 600 }), -1, true);
    return () => cancelAnimation(wiggle);
  }, [wiggle]);
  const flame = useAnimatedStyle(() => ({ transform: [{ rotate: `${wiggle.value}deg` }] }));
  return (
    <LinearGradient
      colors={gradients.combo}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.combo, compact && styles.comboCompact]}
    >
      <Animated.View style={flame}>
        <Flame size={compact ? 13 : 17} color="#fff" />
      </Animated.View>
      <Text style={[styles.comboText, compact && { fontSize: 10 }]}>COMBO ×{combo}</Text>
      <View style={[styles.comboBar, { width: `${(comboTimer / 6) * 100}%` }]} />
    </LinearGradient>
  );
};

export const HUD: React.FC<HUDProps> = (props) => {
  const { layout, page, chapterNumber, score, remainingTime, combo, comboTimer, soundEnabled, isNight, topInset, insetLeft, insetRight } =
    props;
  const wide = layout === 'wide';
  const iconSize = wide ? 18 : 17;
  const SoundIcon = soundEnabled ? Volume2 : VolumeX;

  const actions = (
    <View style={styles.actions}>
      <IconButton onPress={props.onOpenAlbum} label="Sổ Tay" showLabel={wide} tone="album">
        <BookHeart size={iconSize} color={colors.emerald} />
      </IconButton>
      <IconButton onPress={props.onToggleSound} label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}>
        <SoundIcon size={iconSize} color={colors.ink} />
      </IconButton>
      <IconButton onPress={props.onUseHint} label="Gợi Ý" showLabel={wide} tone="hint">
        <CircleQuestionMark size={iconSize} color={colors.earth} />
      </IconButton>
      <IconButton onPress={props.onPause} label="Tạm dừng">
        <Pause size={iconSize} color={colors.ink} />
      </IconButton>
    </View>
  );

  const scoreBox = (
    <View style={styles.score}>
      {wide && <Text style={styles.metaLabel}>ĐIỂM ĐIỀU TRA</Text>}
      <Text style={[styles.scoreValue, !wide && { fontSize: 17 }]}>{formatNumber(score)}</Text>
    </View>
  );

  const container = [
    styles.container,
    { paddingTop: topInset + (wide ? 10 : 6), paddingLeft: insetLeft + 10, paddingRight: insetRight + 10 },
  ];
  const background = (
    <LinearGradient
      colors={
        isNight ? ['rgba(27, 36, 64, 0.97)', 'rgba(27, 36, 64, 0.9)'] : ['rgba(240, 236, 226, 0.97)', 'rgba(240, 236, 226, 0.9)']
      }
      style={StyleSheet.absoluteFill}
    />
  );

  if (layout === 'phoneLandscape') {
    return (
      <View style={[container, styles.row, { paddingBottom: 5 }]}>
        {background}
        <PageSwitcher {...props} />
        {isNight && <NightBadge />}
        <Text style={[styles.title, styles.titleCompact, { flex: 1 }, isNight && styles.titleNight]} numberOfLines={1}>
          {page.title}
        </Text>
        <Timer remaining={remainingTime} limit={page.timeLimit} compact />
        {combo > 1 && <ComboBadge combo={combo} comboTimer={comboTimer} compact />}
        {scoreBox}
        {actions}
      </View>
    );
  }

  if (layout === 'phone') {
    return (
      <View style={[container, { paddingBottom: 6, gap: 6 }]}>
        {background}
        <View style={styles.row}>
          <PageSwitcher {...props} />
          <Text style={[styles.title, styles.titleCompact, { flex: 1 }, isNight && styles.titleNight]} numberOfLines={1}>
            {page.title}
          </Text>
          {isNight && <NightBadge />}
        </View>
        <View style={styles.row}>
          <Timer remaining={remainingTime} limit={page.timeLimit} compact />
          <View style={{ flex: 1 }} />
          {combo > 1 && <ComboBadge combo={combo} comboTimer={comboTimer} compact />}
          {scoreBox}
          {actions}
        </View>
      </View>
    );
  }

  return (
    <View style={[container, styles.row, { paddingBottom: 10, justifyContent: 'space-between' }]}>
      {background}
      <View style={{ flexShrink: 1 }}>
        <View style={[styles.row, { marginBottom: 4 }]}>
          <Text style={styles.caseTag}>HỒ SƠ ĐIỀU TRA #CHƯƠNG {chapterNumber}</Text>
          <PageSwitcher {...props} />
          {isNight && <NightBadge />}
        </View>
        <Text style={[styles.title, isNight && styles.titleNight]} numberOfLines={1}>
          {page.title}
        </Text>
        <Text style={[styles.subtitle, isNight && { color: 'rgba(244, 236, 208, 0.6)' }]} numberOfLines={1}>
          {page.subtitle}
        </Text>
      </View>
      <Timer remaining={remainingTime} limit={page.timeLimit} compact={false} />
      <View style={[styles.row, { gap: 14 }]}>
        {combo > 1 && <ComboBadge combo={combo} comboTimer={comboTimer} compact={false} />}
        {scoreBox}
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
  caseTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.earth,
  },
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 214, 200, 0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    borderRadius: 20,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  arrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  pickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  caret: {
    fontSize: 10,
    color: colors.earth,
  },
  disabled: {
    opacity: 0.3,
  },
  nightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.night,
  },
  nightText: {
    color: colors.moonGold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: 20,
    color: colors.ink,
  },
  titleCompact: {
    fontSize: 15,
  },
  titleNight: {
    color: colors.moonlight,
  },
  subtitle: {
    fontSize: 11,
    color: colors.inkFaint,
    letterSpacing: 0.2,
  },
  timer: {
    alignItems: 'center',
    minWidth: 140,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: colors.inkFaint,
    marginBottom: 2,
  },
  timerBig: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 26,
    letterSpacing: 1,
    color: colors.ink,
  },
  timerSmall: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    letterSpacing: 0.6,
    color: colors.ink,
  },
  timerLow: {
    color: colors.danger,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(220, 214, 200, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  barTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    backgroundColor: 'rgba(44, 40, 36, 0.12)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.earth,
  },
  combo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  comboCompact: {
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comboText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  comboBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  score: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 24,
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 36,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  btnHint: {
    backgroundColor: 'rgba(160, 107, 71, 0.16)',
    borderColor: 'rgba(160, 107, 71, 0.4)',
  },
  btnAlbum: {
    backgroundColor: 'rgba(45, 122, 79, 0.08)',
    borderColor: 'rgba(45, 122, 79, 0.35)',
  },
  btnPressed: {
    backgroundColor: '#fff',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
});
