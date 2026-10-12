import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { CoverSticker } from '../core/model';
import { SpriteIcon } from '../ui/SpriteIcon';
import { colors } from '../ui/theme';

// A sticker at scale 1, as on the inside cover (px)
const STICKER = 56;

const PAPER_WASH = require('../../assets/art/desk/paper-wash.jpg') as number;
const BOTANY_LEFT = require('../../assets/art/desk/botany-left.webp') as number;
const BOTANY_RIGHT = require('../../assets/art/desk/botany-right.webp') as number;

/**
 * Painted desk behind the sketchbook: paper wash and foliage (dimmed on night pages), and the stickers
 * of the player's inside cover, laid where they put them — the book covers those in its way.
 */
export const Desk = React.memo<{ night: boolean; foliage: boolean; stickers: CoverSticker[] }>(({ night, foliage, stickers }) => (
  // Clipped: on the web, nothing of the desk may stretch the page (it would scroll)
  <View style={[StyleSheet.absoluteFill, styles.desk]} pointerEvents="none">
    {/* Sized explicitly: react-native-web otherwise gives the image its own 2400 × 1018 */}
    <Image source={PAPER_WASH} style={[StyleSheet.absoluteFill, styles.wash]} resizeMode="cover" />
    <LinearGradient
      colors={['rgba(236, 231, 220, 0.3)', 'rgba(236, 231, 220, 0.65)', colors.paper]}
      locations={[0, 0.6, 0.95]}
      style={StyleSheet.absoluteFill}
    />
    {foliage && (
      <>
        <Image source={BOTANY_LEFT} style={[styles.leaf, styles.leafLeft, night && { opacity: 0.2 }]} resizeMode="contain" />
        <Image source={BOTANY_RIGHT} style={[styles.leaf, styles.leafRight, night && { opacity: 0.2 }]} resizeMode="contain" />
      </>
    )}
    {stickers.map((s, i) => (
      <View
        key={i}
        style={[
          styles.sticker,
          {
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            transform: [{ translateX: -STICKER / 2 }, { translateY: -STICKER / 2 }, { rotate: `${s.rotation}deg` }, { scale: s.scale }],
          },
        ]}
      >
        <SpriteIcon type={s.type} size={STICKER - 8} />
      </View>
    ))}
    {night && <View style={[StyleSheet.absoluteFill, styles.nightDesk]} />}
  </View>
));

const styles = StyleSheet.create({
  desk: {
    overflow: 'hidden',
  },
  wash: {
    width: '100%',
    height: '100%',
    opacity: 0.88,
  },
  leaf: {
    position: 'absolute',
    bottom: 0,
    width: 220,
    height: 300,
    opacity: 0.45,
  },
  leafLeft: {
    left: -20,
  },
  leafRight: {
    right: -10,
  },
  sticker: {
    position: 'absolute',
    width: STICKER,
    height: STICKER,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.92,
  },
  nightDesk: {
    backgroundColor: 'rgba(12, 16, 34, 0.45)',
  },
});
