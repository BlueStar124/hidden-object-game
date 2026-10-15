import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';
import { cleanDisplayName, NAME_MAX, NAME_MIN } from '../../core/profile';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { DialogHeader } from '../../ui/DialogHeader';
import { Check, UserRound } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { colors, fonts } from '../../ui/theme';

/**
 * The player's name in the game: asked once after signing in when the account has none (an email
 * account made before names, a Google account without one), and changed from the home screen.
 * `onSave` stores it and resolves to an error to show, or null.
 */
export const NameDialog: React.FC<{
  initial: string;
  /** First time (the account has no name): asked, but never in the way — "Để sau" lets the player play on */
  required: boolean;
  onSave: (name: string) => Promise<string | null>;
  onClose: () => void;
}> = ({ initial, required, onSave, onClose }) => {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = cleanDisplayName(text);

  const save = async () => {
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    const failed = await onSave(name);
    setBusy(false);
    if (failed) setError(failed);
    else onClose();
  };

  return (
    <ModalShell
      maxWidth={420}
      zIndex={420}
      backdrop="rgba(28, 24, 20, 0.74)"
      onBackdropPress={required ? undefined : onClose}
      header={<DialogHeader icon={<UserRound size={22} color={colors.earth} />} title="Tên trong game" onClose={required ? undefined : onClose} />}
      contentStyle={styles.content}
      footer={
        <>
          <SecondaryButton label="Để sau" onPress={onClose} />
          <PrimaryButton
            label="Lưu tên"
            icon={busy ? <ActivityIndicator color="#fff" size="small" /> : <Check size={18} color="#fff" />}
            onPress={() => void save()}
            disabled={!name || busy}
          />
        </>
      }
    >
      <Text style={styles.help}>Tên này hiện ở trang chủ và trong lời mời thử thách gửi bạn bè.</Text>
      <TextInput
        value={text}
        onChangeText={(value) => {
          setText(value);
          setError(null);
        }}
        onSubmitEditing={() => void save()}
        maxLength={NAME_MAX + 8}
        placeholder="Ví dụ: Thám tử Lan"
        placeholderTextColor={colors.inkFaint}
        autoFocus
        returnKeyType="done"
        style={styles.input}
        accessibilityLabel="Tên trong game"
      />
      <Text style={[styles.hint, !!text.trim() && !name && styles.hintBad]}>
        {error ?? `Từ ${NAME_MIN} đến ${NAME_MAX} ký tự.`}
      </Text>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingBottom: 6, gap: 8 },
  help: { color: colors.inkSoft, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  input: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#fff',
    color: colors.ink,
    fontSize: 15,
  },
  hint: { color: colors.inkFaint, fontSize: 12 },
  hintBad: { color: colors.crimson },
});
