import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Eye, EyeOff } from './icons';
import { colors } from './theme';

/** The eye beside a password field: shows the password while it is open (`shown`), hides it again. */
export const RevealButton: React.FC<{ shown: boolean; onToggle: () => void }> = ({ shown, onToggle }) => (
  <Pressable
    onPress={onToggle}
    accessibilityRole="button"
    accessibilityLabel={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    hitSlop={8}
    style={({ pressed }) => [styles.button, pressed && styles.pressed]}
  >
    {shown ? <EyeOff size={18} color={colors.earth} /> : <Eye size={18} color={colors.inkSoft} />}
  </Pressable>
);

const styles = StyleSheet.create({
  button: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  pressed: { backgroundColor: 'rgba(154, 106, 62, 0.12)' },
});
