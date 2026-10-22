import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookOpen, ChevronLeft, ChevronRight } from '../../ui/icons';
import { colors, controlIcon } from '../../ui/theme';

interface PageSwitcherProps {
  pageIndex: number;
  pageCount: number;
  huntLabel?: string;
  hasNextUnlocked?: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onOpenIndex: () => void;
}

export const PageSwitcher = React.memo<PageSwitcherProps>(({
  pageIndex,
  pageCount,
  huntLabel,
  hasNextUnlocked,
  onPrevPage,
  onNextPage,
  onOpenIndex,
}) =>
  huntLabel ? (
    // Outside the book there is no page before or after: the index still leads back to it
    <Pressable
      onPress={onOpenIndex}
      hitSlop={6}
      accessibilityLabel={`${huntLabel}. Mở mục lục để về cuốn sổ`}
      style={styles.picker}
    >
      <BookOpen size={13} color={controlIcon.color} />
      <Text style={styles.pickerText}>{huntLabel}</Text>
      <Text style={styles.caret}>▾</Text>
    </Pressable>
  ) : (
    <View style={styles.switcher}>
      <Pressable
        onPress={onPrevPage}
        disabled={pageIndex <= 0}
        hitSlop={8}
        accessibilityLabel="Lật về trang trước"
        style={[styles.arrow, pageIndex <= 0 && styles.disabled]}
      >
        <ChevronLeft size={16} color={controlIcon.color} />
      </Pressable>
      <Pressable
        onPress={onOpenIndex}
        hitSlop={6}
        accessibilityLabel="Mục lục các trang ký họa"
        style={styles.picker}
      >
        <BookOpen size={13} color={controlIcon.color} />
        <Text style={styles.pickerText}>
          Trang {pageIndex + 1} / {pageCount}
        </Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>
      <Pressable
        onPress={onNextPage}
        disabled={pageIndex >= pageCount - 1 || hasNextUnlocked === false}
        hitSlop={8}
        accessibilityLabel="Lật sang trang sau"
        style={[
          styles.arrow,
          (pageIndex >= pageCount - 1 || hasNextUnlocked === false) && styles.disabled,
        ]}
      >
        <ChevronRight size={16} color={controlIcon.color} />
      </Pressable>
    </View>
  )
);

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  arrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  pickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
  },
  caret: {
    fontSize: 10,
    color: colors.earth,
  },
  disabled: {
    opacity: 0.3,
  },
});

