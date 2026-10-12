import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { parseChallenge, type Challenge } from '../../core/challenge';
import { PrimaryButton } from '../../ui/Buttons';
import { DialogHeader } from '../../ui/DialogHeader';
import { Play, Swords } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { colors, fonts } from '../../ui/theme';

interface ChallengeEntryProps {
  /** Opens the challenge; false when its page is not in this version of the books */
  onPlay: (challenge: Challenge) => boolean;
  onClose: () => void;
}

/** A friend's challenge code, typed or pasted (a whole message works too). */
export const ChallengeEntry: React.FC<ChallengeEntryProps> = ({ onPlay, onClose }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const play = () => {
    const challenge = parseChallenge(text);
    if (!challenge) {
      setError('Mã chưa đúng. Mã thử thách có dạng SG3-7K2P-142.');
      return;
    }
    if (!onPlay(challenge)) setError('Mã này dành cho một trang chưa có trong phiên bản game của bạn.');
  };

  return (
    <ModalShell
      maxWidth={460}
      zIndex={360}
      backdrop="rgba(28, 24, 20, 0.74)"
      onBackdropPress={onClose}
      header={
        <DialogHeader icon={<Swords size={22} color={colors.earth} />} title="Thử Thách Của Bạn Bè" description="Chơi đúng trang bạn bè đã chơi, rồi so thời gian" onClose={onClose} />
      }
      footer={<PrimaryButton label="Nhận Thử Thách" icon={<Play size={18} color="#fff" />} onPress={play} disabled={!text.trim()} />}
    >
      <Text style={styles.label}>Nhập hoặc dán mã thử thách</Text>
      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          setError(null);
        }}
        onSubmitEditing={play}
        placeholder="SG3-7K2P-142"
        placeholderTextColor={colors.inkFaint}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="go"
        accessibilityLabel="Mã thử thách"
        style={styles.input}
      />
      <View style={styles.message}>
        {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.hint}>Mã nằm trong lời nhắn bạn bè gửi, sau chữ “Nhập mã”.</Text>}
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  label: {
    alignSelf: 'stretch',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.earth,
    marginBottom: 6,
  },
  input: {
    alignSelf: 'stretch',
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#fff',
    fontFamily: fonts.displayBold,
    fontSize: 20,
    letterSpacing: 2,
    color: colors.ink,
  },
  message: {
    alignSelf: 'stretch',
    minHeight: 36,
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  error: {
    fontSize: 12.5,
    color: colors.crimson,
  },
  hint: {
    fontSize: 12,
    color: colors.inkSoft,
  },
});
