import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BookOpen, Hourglass, RotateCcw } from '../ui/icons';
import type { LevelData } from '@core/types/level';
import { isMainObject } from '@core/game/GameState';
import { colors, fonts } from '../theme';
import { ModalShell } from '../ui/ModalShell';
import { PrimaryButton, SecondaryButton } from '../ui/Buttons';

interface TimeUpScreenProps {
  level: LevelData;
  foundIds: string[];
  onReplay: () => void;
  onOpenIndex: () => void;
}

export const TimeUpScreen: React.FC<TimeUpScreenProps> = ({ level, foundIds, onReplay, onOpenIndex }) => {
  const main = level.objects.filter(isMainObject);
  const found = main.filter((o) => foundIds.includes(o.id)).length;

  // hourglassFlip: rests, then turns over
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.value = withRepeat(
      withSequence(
        withDelay(1700, withTiming(180, { duration: 360 })),
        withDelay(340, withTiming(180, { duration: 0 })),
        withTiming(0, { duration: 0 })
      ),
      -1
    );
  }, [turn]);
  const glass = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));

  return (
    <ModalShell
      maxWidth={420}
      backdrop="rgba(35, 30, 24, 0.68)"
      footer={
        <View style={styles.actions}>
          <SecondaryButton label="Mục Lục" icon={<BookOpen size={16} color={colors.ink} />} onPress={onOpenIndex} />
          <PrimaryButton label="Thử Lại Trang Này" icon={<RotateCcw size={17} color="#fff" />} onPress={onReplay} />
        </View>
      }
    >
      <Animated.View style={[styles.icon, glass]}>
        <Hourglass size={40} color={colors.crimson} />
      </Animated.View>
      <Text style={styles.tag}>HỒ SƠ CÒN DANG DỞ</Text>
      <Text style={styles.title}>Hết Giờ Điều Tra!</Text>
      <Text style={styles.text}>
        Bạn đã tìm được <Text style={styles.bold}>{found}</Text> / {main.length} manh mối ở{' '}
        <Text style={styles.bold}>{level.title}</Text>. Những sinh vật ngụy trang vẫn đang chờ bạn quay lại soi kỹ hơn.
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(found / Math.max(1, main.length)) * 100}%` }]} />
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  icon: {
    marginBottom: 6,
  },
  tag: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.crimson,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    marginTop: 4,
    marginBottom: 8,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 14,
  },
  bold: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  track: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(43, 39, 33, 0.1)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.goldLight,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
