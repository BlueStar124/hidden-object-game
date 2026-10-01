import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { parse, SvgAst, type JsxAST } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { SpriteType } from '@core/types/level';
import { SPRITE_SVG } from '../sprites/art.generated';

// Parsed once per drawing and shared by every icon (the album shows dozens at a time)
const asts = new Map<string, JsxAST | null>();
function astOf(type: SpriteType, revealed: boolean): JsxAST | null {
  const key = `${type}|${revealed ? 1 : 0}`;
  if (!asts.has(key)) {
    const xml = SPRITE_SVG[type];
    // `filter: brightness(0); opacity: 0.42` — the ink silhouette of a target that is still unfound
    const source = xml && (revealed ? xml : xml.replace(/(fill|stroke)="(?!none)[^"]*"/g, '$1="#000"'));
    asts.set(key, source ? parse(source) : null);
  }
  return asts.get(key) ?? null;
}

interface SpriteIconProps {
  type?: SpriteType;
  size: number;
  /** Unfound: only the silhouette; found: full colour (with a little pop when it turns) */
  revealed?: boolean;
  glow?: boolean; // the secret artefact's golden halo
}

/** Static drawing of a sprite for cards, album and summaries (the board draws them with Skia). */
export const SpriteIcon: React.FC<SpriteIconProps> = ({ type, size, revealed = true, glow = false }) => {
  const ast = type ? astOf(type, revealed) : null;
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  // foundBounce (1 → 1.4 −8° → 0.9 4° → 1) the moment a silhouette turns into the real thing
  const wasRevealed = useRef(revealed);
  useEffect(() => {
    const turned = revealed && !wasRevealed.current;
    wasRevealed.current = revealed;
    if (!turned) return;
    const t = (ms: number) => ({ duration: ms, easing: Easing.bezier(0.175, 0.885, 0.32, 1.275) });
    scale.value = withSequence(withTiming(1.4, t(240)), withTiming(0.9, t(180)), withTiming(1, t(180)));
    rotate.value = withSequence(withTiming(-8, t(240)), withTiming(4, t(180)), withTiming(0, t(180)));
  }, [revealed, rotate, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }] }));

  if (!ast) return <View style={{ width: size, height: size }} />;
  return (
    <Animated.View style={[{ width: size, height: size }, glow && styles.glow, style]}>
      <SvgAst ast={ast} override={{ width: size, height: size, opacity: revealed ? 1 : 0.42 }} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  glow: {
    shadowColor: '#f59e0b',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
