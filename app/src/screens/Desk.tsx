import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../ui/theme';

const PAPER_WASH = require('../../assets/art/desk/paper-wash.jpg') as number;
const BOTANY_LEFT = require('../../assets/art/desk/botany-left.webp') as number;
const BOTANY_RIGHT = require('../../assets/art/desk/botany-right.webp') as number;

/** Painted desk behind the sketchbook: paper wash and foliage (dimmed on night pages). */
export const Desk = React.memo<{ night: boolean; foliage: boolean }>(({ night, foliage }) => (
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
  nightDesk: {
    backgroundColor: 'rgba(12, 16, 34, 0.45)',
  },
});
