import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ZoomIn, ZoomOut } from '../../ui/icons';
import { colors } from '../../ui/theme';

export interface ZoomControlProps {
  zoom: number;
  onStepZoom: (dir: 1 | -1) => void;
  disabled?: boolean;
  collapsed?: boolean;
  compact?: boolean;
}

/**
 * Fixed zoom control row (- 1.0x +).
 * Placed at the bottom of the clue column, with min 44x44 touch targets.
 */
export const ZoomControl = React.memo<ZoomControlProps>(function ZoomControl({
  zoom,
  onStepZoom,
  disabled = false,
  collapsed = false,
  compact = false,
}) {
  const canZoomOut = !disabled && zoom > 1.01;
  const canZoomIn = !disabled && zoom < 3.99;

  if (collapsed) {
    return (
      <View style={styles.vertical}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, !canZoomIn && styles.btnDisabled]}
          onPress={() => onStepZoom(1)}
          disabled={!canZoomIn}
          accessibilityRole="button"
          accessibilityLabel="Phóng to trang sách"
          hitSlop={6}
        >
          <ZoomIn size={18} color={canZoomIn ? colors.ink : 'rgba(43, 39, 33, 0.25)'} />
        </Pressable>
        <Text style={styles.levelVertical}>{zoom.toFixed(1)}×</Text>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, !canZoomOut && styles.btnDisabled]}
          onPress={() => onStepZoom(-1)}
          disabled={!canZoomOut}
          accessibilityRole="button"
          accessibilityLabel="Thu nhỏ trang sách"
          hitSlop={6}
        >
          <ZoomOut size={18} color={canZoomOut ? colors.ink : 'rgba(43, 39, 33, 0.25)'} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.horizontal, compact ? styles.horizontalPhone : styles.horizontalLaptop]}>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, !canZoomOut && styles.btnDisabled]}
        onPress={() => onStepZoom(-1)}
        disabled={!canZoomOut}
        accessibilityRole="button"
        accessibilityLabel="Thu nhỏ trang sách"
        hitSlop={6}
      >
        <ZoomOut size={compact ? 18 : 20} color={canZoomOut ? colors.ink : 'rgba(43, 39, 33, 0.25)'} />
      </Pressable>
      <View style={styles.labelWrapper}>
        <Text style={[styles.level, !compact && styles.levelLaptop]}>{zoom.toFixed(1)}×</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, !canZoomIn && styles.btnDisabled]}
        onPress={() => onStepZoom(1)}
        disabled={!canZoomIn}
        accessibilityRole="button"
        accessibilityLabel="Phóng to trang sách"
        hitSlop={6}
      >
        <ZoomIn size={compact ? 18 : 20} color={canZoomIn ? colors.ink : 'rgba(43, 39, 33, 0.25)'} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffdf5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingHorizontal: 8,
  },
  horizontalPhone: {
    height: 46,
  },
  horizontalLaptop: {
    height: 50,
  },
  vertical: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffdf5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingVertical: 6,
    gap: 2,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    backgroundColor: 'rgba(43, 39, 33, 0.08)',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  labelWrapper: {
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  level: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2B2721',
  },
  levelLaptop: {
    fontSize: 15,
  },
  levelVertical: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B2721',
    textAlign: 'center',
  },
});

