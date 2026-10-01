import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme';

interface ButtonProps {
  label: string;
  icon?: React.ReactNode;
  iconAfter?: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** Gold gradient call to action (`.btn-primary` on the web). */
export const PrimaryButton: React.FC<ButtonProps & { tall?: boolean }> = ({
  label,
  icon,
  iconAfter,
  onPress,
  style,
  disabled,
  tall,
  accessibilityLabel,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? label}
    style={({ pressed }) => [
      styles.primaryWrap,
      tall && styles.tall,
      style,
      pressed && styles.pressedPrimary,
      disabled && styles.disabled,
    ]}
  >
    <LinearGradient colors={gradients.primary} style={[styles.primary, tall && styles.tall]}>
      {icon}
      <Text style={styles.primaryText} numberOfLines={1}>
        {label}
      </Text>
      {iconAfter}
    </LinearGradient>
  </Pressable>
);

/** Paper button (`.btn-secondary` on the web). */
export const SecondaryButton: React.FC<ButtonProps & { tone?: 'default' | 'danger' }> = ({
  label,
  icon,
  onPress,
  style,
  disabled,
  tone = 'default',
  accessibilityLabel,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? label}
    style={({ pressed }) => [styles.secondary, style, pressed && styles.pressedSecondary, disabled && styles.disabled]}
  >
    {icon}
    <Text style={[styles.secondaryText, tone === 'danger' && { color: colors.crimson }]} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);

/** Round icon button used in headers (close ✕). */
export const RoundIconButton: React.FC<{ onPress: () => void; children: React.ReactNode; accessibilityLabel: string }> = ({
  onPress,
  children,
  accessibilityLabel,
}) => (
  <Pressable
    onPress={onPress}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [styles.round, pressed && styles.pressedSecondary]}
  >
    <View>{children}</View>
  </Pressable>
);

const styles = StyleSheet.create({
  primaryWrap: {
    flex: 2,
    minHeight: 46,
    borderRadius: 10,
    shadowColor: '#9a6a3e',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  tall: {
    minHeight: 50,
    borderRadius: 12,
  },
  primaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  pressedPrimary: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  secondary: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
  },
  secondaryText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  pressedSecondary: {
    backgroundColor: '#fff',
  },
  disabled: {
    opacity: 0.45,
  },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
});
