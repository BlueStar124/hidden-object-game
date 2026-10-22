import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Star } from '../../../ui/icons';

interface PopStarProps {
  index: number;
  active: boolean;
  size: number;
}

export const PopStar: React.FC<PopStarProps> = React.memo(({ index, active, size }) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 250,
      withTiming(1, { duration: 500, easing: Easing.bezier(0.175, 0.885, 0.32, 1.275) })
    );
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[style, active && styles.starGlow]}>
      <Star
        size={size}
        color={active ? '#eab308' : 'rgba(43, 39, 33, 0.2)'}
        fill={active ? '#eab308' : 'none'}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  starGlow: {
    shadowColor: '#eab308',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});

