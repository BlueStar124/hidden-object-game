import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { colors, fonts } from '../../ui/theme';

interface BrandLogoProps {
  onPress: () => void;
  mode?: 'full' | 'titleOnly' | 'compact';
  isNight?: boolean;
}

/** Brand logo that doubles as the home link: hover and tap return to the main desk. */
export const BrandLogo = React.memo<BrandLogoProps>(({ onPress, mode = 'full', isNight }) => {
  const isCompact = mode === 'compact';
  const isTitleOnly = mode === 'titleOnly';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="The Lost Sketchbook — Về trang chủ"
      accessibilityHint="Bấm để quay về trang chủ"
      hitSlop={6}
      style={({ pressed, hovered }: any) => [
        styles.brand,
        isCompact && styles.brandCompact,
        hovered && (isNight ? styles.brandHoverNight : styles.brandHover),
        pressed && styles.brandPressed,
      ]}
    >
      <View
        style={[
          styles.brandEmblem,
          isTitleOnly && styles.brandEmblemMedium,
          isCompact && styles.brandEmblemCompact,
          isNight && styles.brandEmblemNight,
        ]}
      >
        <SpriteIcon type="magnifying-glass" size={isCompact ? 14 : isTitleOnly ? 17 : 20} />
      </View>
      <View style={[styles.brandTextGroup, isCompact && styles.brandTextGroupCompact]}>
        <Text
          style={[
            styles.brandTitle,
            isTitleOnly && styles.brandTitleMedium,
            isCompact && styles.brandTitleCompact,
            isNight && styles.brandTitleNight,
          ]}
          numberOfLines={1}
        >
          {isCompact ? 'Sổ Ký Họa' : 'The Lost Sketchbook'}
        </Text>
        {mode === 'full' && (
          <View style={styles.brandMetaRow}>
            <Text style={[styles.brandTag, isNight && styles.brandTagNight]}>SỔ KÝ HỌA</Text>
            <Text style={[styles.brandDot, isNight && styles.brandDotNight]}>•</Text>
            <Text style={[styles.brandHomeNotice, isNight && styles.brandHomeNoticeNight]}>
              Trang chủ ↩
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  brandCompact: {
    gap: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  brandHover: {
    backgroundColor: 'rgba(154, 106, 62, 0.08)',
    borderColor: 'rgba(154, 106, 62, 0.28)',
  },
  brandHoverNight: {
    backgroundColor: 'rgba(244, 213, 141, 0.1)',
    borderColor: 'rgba(244, 213, 141, 0.3)',
  },
  brandPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  brandEmblem: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(154, 106, 62, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(154, 106, 62, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmblemCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  brandEmblemMedium: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  brandEmblemNight: {
    backgroundColor: 'rgba(244, 213, 141, 0.14)',
    borderColor: 'rgba(244, 213, 141, 0.32)',
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTextGroupCompact: {
    maxWidth: 135,
  },
  brandTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 17.5,
    letterSpacing: 0.4,
    color: colors.ink,
  },
  brandTitleMedium: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 15.5,
    letterSpacing: 0.3,
  },
  brandTitleCompact: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  brandTitleNight: {
    color: colors.moonlight,
  },
  brandMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  brandTag: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.earth,
  },
  brandTagNight: {
    color: colors.moonGold,
  },
  brandDot: {
    fontSize: 9.5,
    color: colors.earth,
    opacity: 0.6,
  },
  brandDotNight: {
    color: colors.moonGold,
    opacity: 0.6,
  },
  brandHomeNotice: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 0.2,
  },
  brandHomeNoticeNight: {
    color: colors.moonGold,
  },
});

