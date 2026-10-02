import React from 'react';
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
}

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
}) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const pad = 12;
  const maxHeight = height - insets.top - insets.bottom - 2 * pad;

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

      <Animated.View
        entering={ZoomIn.springify().damping(18).stiffness(180)}
        style={[styles.card, { maxWidth, maxHeight }, cardStyle]}
      >
        {header}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentStyle]}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    justifyContent: 'center',
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
