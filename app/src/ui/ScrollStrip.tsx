import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronLeft, ChevronRight } from './icons';
import { colors } from './theme';

// How far an arrow scrolls: most of what is in view, so the next items are in reach at once
const STEP = 0.8;

/**
 * A row that scrolls sideways, with arrows at both ends when there is more to see: a mouse on the web
 * cannot drag a ScrollView, and a finger may not guess the row goes on.
 */
export const ScrollStrip: React.FC<{
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Spoken names of the arrows */
  label: string;
}> = ({ children, contentContainerStyle, label }) => {
  const ref = useRef<ScrollView>(null);
  const [view, setView] = useState({ x: 0, width: 0, content: 0 });
  const canBack = view.x > 1;
  const canOn = view.x + view.width < view.content - 1;

  const go = (dir: 1 | -1) => ref.current?.scrollTo({ x: Math.max(0, view.x + dir * view.width * STEP), animated: true });
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setView((v) => (Math.abs(v.x - x) < 1 ? v : { ...v, x }));
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={contentContainerStyle}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onLayout={(e: LayoutChangeEvent) => {
          const width = e.nativeEvent.layout.width;
          setView((v) => (v.width === width ? v : { ...v, width }));
        }}
        onContentSizeChange={(content) => setView((v) => (v.content === content ? v : { ...v, content }))}
      >
        {children}
      </ScrollView>
      {canBack && (
        <Pressable onPress={() => go(-1)} accessibilityRole="button" accessibilityLabel={`${label}: lùi lại`} hitSlop={6} style={[styles.arrow, styles.left]}>
          <ChevronLeft size={18} color={colors.ink} />
        </Pressable>
      )}
      {canOn && (
        <Pressable onPress={() => go(1)} accessibilityRole="button" accessibilityLabel={`${label}: xem tiếp`} hitSlop={6} style={[styles.arrow, styles.right]}>
          <ChevronRight size={18} color={colors.ink} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // As wide as its column, whatever that column centres: the row scrolls instead of overflowing
  root: { alignSelf: 'stretch', justifyContent: 'center' },
  scroll: { flexGrow: 0 },
  arrow: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(255, 253, 248, 0.95)',
  },
  left: { left: 0 },
  right: { right: 0 },
});
