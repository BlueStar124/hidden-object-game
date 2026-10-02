import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';

interface ModalShellProps {
  children: React.ReactNode;
  /** Pinned under the scrolling content so the main action is always reachable on small phones */
  footer?: React.ReactNode;
  header?: React.ReactNode;
  maxWidth?: number;
  onBackdropPress?: () => void;
  backdrop?: string;
  cardStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  zIndex?: number;
  /** Long lists (page index, album): the content scrolls. Any other dialog shrinks to fit. */
  scroll?: boolean;
}

// The smallest a dialog shrinks to fit the screen: below it, its smallest text would be hard to
// read, so the content scrolls instead (tools/test-screens.mjs checks every dialog stays above)
const MIN_SCALE = 0.75;

/** Backdrop + paper card shared by every dialog (prologue, pause, victory, index, album…). */
export const ModalShell: React.FC<ModalShellProps> = ({
  children,
  footer,
  header,
  maxWidth = 460,
  onBackdropPress,
  backdrop = colors.backdrop,
  cardStyle,
  contentStyle,
  zIndex = 200,
  scroll = false,
}) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const pad = height < 420 ? 8 : 12;
  const maxHeight = height - insets.top - insets.bottom - 2 * pad;

  // Shrink to fit: the whole card as it would be laid out without a height limit, scaled down to
  // the screen (on a phone held sideways, the dialog is seen whole rather than scrolled)
  const [sizes, setSizes] = useState({ header: 0, content: 0, footer: 0 });
  const measured = (part: keyof typeof sizes) => (h: number) => setSizes((s) => (s[part] === h ? s : { ...s, [part]: h }));
  const natural = sizes.header + sizes.content + sizes.footer + 2; // + the card's border
  const scale = scroll || !sizes.content ? 1 : Math.max(MIN_SCALE, Math.min(1, maxHeight / natural));

  return (
    <Animated.View
      // No exit animation on purpose: a backdrop lingering through one (even invisibly) would
      // swallow the touches meant for the sketchbook
      entering={FadeIn.duration(250)}
      style={[
        StyleSheet.absoluteFill,
        styles.backdrop,
        {
          backgroundColor: backdrop,
          zIndex,
          paddingTop: insets.top + pad,
          paddingBottom: insets.bottom + pad,
          paddingLeft: insets.left + pad,
          paddingRight: insets.right + pad,
        },
      ]}
    >
      {/* Always catch touches on the backdrop: nothing must reach the sketchbook underneath */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onBackdropPress}
        accessible={!!onBackdropPress}
        accessibilityLabel={onBackdropPress ? 'Đóng' : undefined}
      />

      {/* Laid out at the height it is shown at once scaled (about its centre) */}
      <View style={[styles.fit, { maxWidth, transform: [{ scale }] }]}>
        <Animated.View
          entering={ZoomIn.springify().damping(18).stiffness(180)}
          style={[styles.card, { maxHeight: maxHeight / scale }, cardStyle]}
          testID="dialog"
        >
          {header && <View onLayout={(e) => measured('header')(e.nativeEvent.layout.height)}>{header}</View>}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, contentStyle]}
            onContentSizeChange={(_w, h) => measured('content')(h)}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer && (
            <View style={styles.footer} onLayout={(e) => measured('footer')(e.nativeEvent.layout.height)}>
              {footer}
            </View>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // a card laid out taller than the screen (then scaled) must not scroll the page
  },
  fit: {
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: colors.paperCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 6,
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 18,
  },
});
