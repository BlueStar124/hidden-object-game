import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { DialogHeader } from '../../ui/DialogHeader';
import { Check, Lock } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { colors, fonts } from '../../ui/theme';

/** Shortest password the account server takes (Supabase's default). */
const PASSWORD_MIN = 6;

/**
 * A new password, after a reset link from an email signed the player in (AuthGate).
 * `onSave` stores it and resolves to an error to show, or null.
 */
export const PasswordDialog: React.FC<{
  onSave: (password: string) => Promise<string | null>;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tooShort = password.length > 0 && password.length < PASSWORD_MIN;
  const mismatch = again.length > 0 && again !== password;
  const ready = password.length >= PASSWORD_MIN && again === password;

  const save = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    const failed = await onSave(password);
    setBusy(false);
    if (failed) setError(failed);
    else onClose();
  };

  return (
    <ModalShell
      maxWidth={420}
      zIndex={430}
      backdrop="rgba(28, 24, 20, 0.74)"
      header={<DialogHeader icon={<Lock size={22} color={colors.earth} />} title="Đặt mật khẩu mới" onClose={onClose} />}
      contentStyle={styles.content}
      footer={
        <>
          <SecondaryButton label="Để sau" onPress={onClose} />
          <PrimaryButton
            label="Lưu mật khẩu"
            icon={busy ? <ActivityIndicator color="#fff" size="small" /> : <Check size={18} color="#fff" />}
            onPress={() => void save()}
            disabled={!ready || busy}
          />
        </>
      }
    >
      <Text style={styles.help}>Đặt mật khẩu mới cho tài khoản của bạn.</Text>
      <TextInput
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setError(null);
        }}
        placeholder={`Mật khẩu mới (ít nhất ${PASSWORD_MIN} ký tự)`}
        placeholderTextColor={colors.inkFaint}
        secureTextEntry
        autoComplete="new-password"
        autoFocus
        style={styles.input}
        accessibilityLabel="Mật khẩu mới"
      />
      <TextInput
        value={again}
        onChangeText={(value) => {
          setAgain(value);
          setError(null);
        }}
        onSubmitEditing={() => void save()}
        placeholder="Nhập lại mật khẩu mới"
        placeholderTextColor={colors.inkFaint}
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="done"
        style={styles.input}
        accessibilityLabel="Nhập lại mật khẩu mới"
      />
      <Text style={[styles.hint, (tooShort || mismatch || !!error) && styles.hintBad]}>
        {error ?? (tooShort ? `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.` : mismatch ? 'Hai mật khẩu chưa giống nhau.' : ' ')}
      </Text>
    </ModalShell>
  );
};

/** A short message about the account (a link that expired, a password saved). */
export const AuthNotice: React.FC<{ title: string; text: string; onClose: () => void }> = ({ title, text, onClose }) => (
  <ModalShell
    maxWidth={400}
    zIndex={430}
    backdrop="rgba(28, 24, 20, 0.6)"
    onBackdropPress={onClose}
    header={<DialogHeader icon={<Lock size={22} color={colors.earth} />} title={title} onClose={onClose} />}
    contentStyle={styles.content}
    footer={<PrimaryButton label="Đã hiểu" icon={<Check size={18} color="#fff" />} onPress={onClose} />}
  >
    <Text style={styles.help}>{text}</Text>
  </ModalShell>
);

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
