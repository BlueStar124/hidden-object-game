import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { FloatingNotification } from '@core/hooks/useGame';
import { colors, fonts } from '../theme';

/** floatUp: rises 45px while popping in and fading out (1.2s for points, 1.8s for notices). */
const Floating: React.FC<{ item: FloatingNotification; origin: { x: number; y: number } }> = ({ item, origin }) => {
  const info = item.variant === 'info';
  const p = useSharedValue(0);
  const [width, setWidth] = React.useState(0);

  useEffect(() => {
    p.value = withTiming(1, { duration: info ? 1800 : 1200, easing: Easing.out(Easing.quad) });
  }, [info, p]);

  const style = useAnimatedStyle(() => {
    const t = p.value;
    const rise = t < 0.2 ? (t / 0.2) * -15 : -15 - ((t - 0.2) / 0.8) * 30;
    const scale = t < 0.2 ? 0.8 + (t / 0.2) * 0.3 : 1.1 - ((t - 0.2) / 0.8) * 0.1;
    const opacity = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
    return { opacity, transform: [{ translateX: -width / 2 }, { translateY: rise }, { scale }] };
  });

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.item, { left: item.x - origin.x, top: item.y - origin.y }, info && styles.infoPill, style]}
    >
      <Text style={info ? styles.infoText : styles.scoreText} numberOfLines={1}>
        {item.text}
      </Text>
    </Animated.View>
  );
};

export const FloatingScores: React.FC<{ items: FloatingNotification[]; origin: { x: number; y: number } }> = ({
  items,
  origin,
}) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {items.map((f) => (
      <Floating key={f.id} item={f} origin={origin} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
    zIndex: 150,
  },
  scoreText: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: colors.gold,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  infoPill: {
    backgroundColor: 'rgba(255, 252, 245, 0.95)',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    maxWidth: 340,
  },
  infoText: {
    fontFamily: fonts.bodySemiBoldItalic,
    fontSize: 14.5,
    color: colors.ink,
  },
});
