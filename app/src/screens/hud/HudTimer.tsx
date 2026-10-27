import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { formatClock } from '../../ui/format';
import { colors, fonts } from '../../ui/theme';

interface HudTimerProps {
  remaining: number;
  limit: number;
  compact: boolean;
  medium?: boolean;
  isNight?: boolean;
}

/** Countdown with its bar; turns red under 1 minute (00:59 to 00:00) and pulses in the last 30 seconds. */
export const HudTimer: React.FC<HudTimerProps> = React.memo(
  ({ remaining, limit, compact, medium = false, isNight }) => {
    const isRed = remaining < 60; // Turns red from 00:59 down to 00:00
    const urgent = remaining <= 30; // Pulses during the final 30 seconds
    const pulse = useSharedValue(1);
    const fill = useSharedValue(Math.min(1, remaining / Math.max(1, limit)));

    useEffect(() => {
      fill.value = withTiming(Math.min(1, remaining / Math.max(1, limit)), {
        duration: 300,
        easing: Easing.linear,
      });
    }, [remaining, limit, fill]);

    useEffect(() => {
      if (urgent) {
        pulse.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 500 }),
            withTiming(0.97, { duration: 500 })
          ),
          -1,
          true
        );
      } else {
        cancelAnimation(pulse);
        pulse.value = 1;
      }
    }, [urgent, pulse]);

    const pulseStyle = useAnimatedStyle(() => ({
      transform: [{ scale: pulse.value }],
      opacity: urgent ? 0.75 + (pulse.value - 0.97) * 4.5 : 1,
    }));
    const barStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

    if (compact) {
      return (
        <View style={[styles.timerPill, isNight && styles.timerPillNight]}>
          <Animated.Text
            style={[
              styles.timerSmall,
              isNight && styles.timerNight,
              isRed && styles.timerLow,
              pulseStyle,
            ]}
          >
            {formatClock(remaining)}
          </Animated.Text>
          <View
            style={[
              styles.barTrack,
              isNight && styles.barTrackNight,
              { width: 40, marginTop: 0 },
            ]}
          >
            <Animated.View
              style={[styles.barFill, isRed && { backgroundColor: colors.danger }, barStyle]}
            />
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.timer,
          medium && styles.timerMedium,
          isNight && styles.timerNightCard,
          isRed && styles.timerCardRed,
        ]}
      >
        <Text
          style={[
            styles.metaLabel,
            medium && styles.metaLabelMedium,
            isNight && styles.metaLabelNight,
            isRed && styles.metaLabelRed,
          ]}
        >
          THỜI GIAN CÒN LẠI
        </Text>
        <Animated.Text
          style={[
            styles.timerBig,
            medium && styles.timerBigMedium,
            isNight && styles.timerNight,
            isRed && styles.timerLow,
            pulseStyle,
          ]}
        >
          {formatClock(remaining)}
        </Animated.Text>
        <View style={[styles.barTrack, isNight && styles.barTrackNight]}>
          <Animated.View
            style={[styles.barFill, isRed && { backgroundColor: colors.danger }, barStyle]}
          />
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  timer: {
    alignItems: 'center',
    minWidth: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  timerMedium: {
    minWidth: 96,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timerNightCard: {
    backgroundColor: 'rgba(27, 36, 64, 0.7)',
    borderColor: 'rgba(244, 236, 208, 0.18)',
  },
  timerCardRed: {
    borderColor: 'rgba(220, 38, 38, 0.45)',
    backgroundColor: 'rgba(254, 242, 242, 0.7)',
  },
  timerNight: {
    color: colors.moonlight,
  },
  metaLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#6D6255',
    marginBottom: 1,
  },
  metaLabelMedium: {
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  metaLabelNight: {
    color: 'rgba(244, 236, 208, 0.7)',
  },
  metaLabelRed: {
    color: colors.danger,
  },
  timerBig: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 23,
    letterSpacing: 0.8,
    color: '#2B2721',
  },
  timerBigMedium: {
    fontSize: 18.5,
    letterSpacing: 0.5,
  },
  timerSmall: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
    letterSpacing: 0.6,
    color: '#2B2721',
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
  timerPillNight: {
    backgroundColor: 'rgba(40, 50, 90, 0.7)',
  },
  barTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    backgroundColor: 'rgba(44, 40, 36, 0.12)',
    overflow: 'hidden',
  },
  barTrackNight: {
    backgroundColor: 'rgba(244, 236, 208, 0.18)',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.earth,
  },
});

