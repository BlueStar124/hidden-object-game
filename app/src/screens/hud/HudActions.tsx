import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BookHeart,
  CircleQuestionMark,
  Pause,
  Volume2,
  VolumeX,
} from '../../ui/icons';
import { accentControl, colors, controlIcon } from '../../ui/theme';

interface HudActionsProps {
  wide: boolean;
  freeHintAvailable?: boolean;
  soundEnabled: boolean;
  compactBtn?: boolean;
  showAlbumLabel?: boolean;
  hintLabel?: string;
  showHintLabel?: boolean;
  onOpenAlbum: () => void;
  onToggleSound: () => void;
  onUseHint: () => void;
  onPause: () => void;
}

const IconButton: React.FC<{
  onPress: () => void;
  label: string;
  showLabel?: boolean;
  compact?: boolean;
  fontSize?: number;
  /** 'accent': the one button that asks for attention (the hint) */
  tone?: 'default' | 'accent';
  children: React.ReactNode;
}> = ({
  onPress,
  label,
  showLabel,
  compact = false,
  fontSize,
  tone = 'default',
  children,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    hitSlop={4}
    style={({ pressed }) => [
      styles.btn,
      compact && styles.btnCompact,
      !showLabel && (compact ? styles.btnIconCompact : styles.btnIcon),
      tone === 'accent' && accentControl,
      pressed && styles.btnPressed,
    ]}
  >
    {children}
    {showLabel && (
      <Text
        style={[
          styles.btnText,
          fontSize ? { fontSize } : null,
          tone === 'accent' && styles.btnTextAccent,
        ]}
      >
        {label}
      </Text>
    )}
  </Pressable>
);

export const HudActions = React.memo<HudActionsProps>(({
  wide,
  freeHintAvailable,
  soundEnabled,
  compactBtn = false,
  showAlbumLabel = wide,
  hintLabel,
  showHintLabel = wide,
  onOpenAlbum,
  onToggleSound,
  onUseHint,
  onPause,
}) => {
  const icon = { size: compactBtn ? 15 : controlIcon.size, color: controlIcon.color };
  const SoundIcon = soundEnabled ? Volume2 : VolumeX;
  const computedHintLabel =
    hintLabel ??
    (showHintLabel ? (freeHintAvailable ? 'Gợi Ý (Miễn phí)' : 'Gợi Ý') : 'Gợi Ý');

  return (
    <View
      style={[
        styles.actions,
        !wide && styles.actionsNarrow,
        compactBtn && styles.actionsCompact,
      ]}
    >
      <IconButton
        onPress={onOpenAlbum}
        label="Sổ Tay"
        showLabel={showAlbumLabel}
        compact={compactBtn}
      >
        <BookHeart {...icon} />
      </IconButton>
      <IconButton
        onPress={onToggleSound}
        label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
        compact={compactBtn}
      >
        <SoundIcon {...icon} />
      </IconButton>
      <IconButton
        onPress={onUseHint}
        label={computedHintLabel}
        showLabel={showHintLabel}
        compact={compactBtn}
        tone="accent"
      >
        <CircleQuestionMark {...icon} />
      </IconButton>
      <IconButton onPress={onPause} label="Tạm dừng" compact={compactBtn}>
        <Pause {...icon} />
      </IconButton>
    </View>
  );
});

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionsNarrow: {
    gap: 4,
  },
  actionsCompact: {
    gap: 3.5,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 36,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  btnCompact: {
    height: 32,
    minWidth: 32,
    paddingHorizontal: 5,
    borderRadius: 8,
  },
  btnIcon: {
    minWidth: 34,
    paddingHorizontal: 6,
  },
  btnIconCompact: {
    minWidth: 32,
    paddingHorizontal: 4,
  },
  btnPressed: {
    backgroundColor: '#fff',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  btnTextAccent: {
    color: colors.earth,
    fontWeight: '700',
  },
});

