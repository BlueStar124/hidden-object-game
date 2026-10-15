import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mail, Swords } from '../../ui/icons';
import { colors } from '../../ui/theme';

/** What a result dialog can share (screens/share/useShare). */
export interface ShareActions {
  /** Sends a postcard of the page */
  onPostcard: () => void;
  /** Dares a friend to beat this hunt (none: nothing to dare, e.g. the daily page) */
  onChallenge?: () => void;
  /** The challenge code, shown beside the button */
  code?: string;
  busy: boolean;
  note: string | null;
}

interface ShareRowProps extends ShareActions {
  /** row: labelled buttons (and the note); flank: icon buttons either side of `children` (little height) */
  layout?: 'row' | 'flank';
  children?: React.ReactNode;
}

/** Small buttons under a result: a postcard to send, a friend to dare. */
export const ShareRow = React.memo<ShareRowProps>(({ onPostcard, onChallenge, code, busy, layout = 'row', children, note }) => {
  const iconOnly = layout === 'flank';
  const postcard = (
    <Pill
      onPress={onPostcard}
      disabled={busy}
      label="Gửi bưu thiếp"
      iconOnly={iconOnly}
      icon={busy ? <ActivityIndicator size="small" color={colors.earth} /> : <Mail size={iconOnly ? 17 : 14} color={colors.earth} />}
    />
  );
  const challenge = onChallenge && (
    <Pill
      onPress={onChallenge}
      disabled={busy}
      label={code && !iconOnly ? `Thách bạn bè · ${code}` : 'Thách bạn bè'}
      accessibilityLabel="Thách bạn bè chơi đúng trang này"
      iconOnly={iconOnly}
      icon={<Swords size={iconOnly ? 17 : 14} color={colors.earth} />}
    />
  );
  if (iconOnly) {
    return (
      <View style={styles.flank}>
        {postcard}
        {children}
        {/* (keeps `children` centred) */}
        {challenge ?? <View style={styles.round} />}
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {postcard}
        {challenge}
      </View>
      {note && <ShareNote note={note} />}
    </View>
  );
});

/** What became of a share, when it was not the share sheet (copied, downloaded…). */
export const ShareNote: React.FC<{ note: string }> = ({ note }) => <Text style={styles.note}>{note}</Text>;

const Pill: React.FC<{
  onPress: () => void;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
  iconOnly?: boolean;
  accessibilityLabel?: string;
}> = ({ onPress, disabled, label, icon, iconOnly, accessibilityLabel }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? label}
    style={({ pressed }) => [iconOnly ? styles.round : styles.pill, pressed && styles.pressed, disabled && styles.disabled]}
  >
    {icon}
    {!iconOnly && (
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  flank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(154, 106, 62, 0.35)',
    backgroundColor: 'rgba(216, 168, 94, 0.12)',
  },
  round: {
    width: 38,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(154, 106, 62, 0.35)',
    backgroundColor: 'rgba(216, 168, 94, 0.12)',
  },
  pressed: {
    backgroundColor: 'rgba(216, 168, 94, 0.28)',
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.earth,
  },
  note: {
    fontSize: 11.5,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
