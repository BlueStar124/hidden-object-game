import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Flame } from '../../ui/icons';
import { gradients } from '../../ui/theme';

interface ComboBadgeProps {
  combo: number;
  comboTimer: number;
  compact: boolean;
}

export const ComboBadge: React.FC<ComboBadgeProps> = React.memo(
  ({ combo, comboTimer, compact }) => {
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
  }
);

const styles = StyleSheet.create({
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
});

