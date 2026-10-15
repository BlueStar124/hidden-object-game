import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { parseChallenge, parseFriendCode, type Challenge, type FriendChallenge } from '../../core/challenge';
import { getFriendChallenge } from '../../platform/friendChallenges';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { DialogHeader } from '../../ui/DialogHeader';
import { Play, Swords } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { colors, fonts } from '../../ui/theme';
import { ChallengeCreate } from './ChallengeCreate';

interface ChallengeEntryProps {
  /** Opens the challenge, or returns a message explaining why it cannot be opened. */
  onPlay: (challenge: Challenge) => string | null;
  onPlayFriend?: (challenge: FriendChallenge) => string | null;
  onClose: () => void;
  onSignIn?: () => void;
  /** Signed in: needed to publish or receive a friend's hunt */
  signedIn?: boolean;
  initialMode?: 'create' | 'receive';
  initialText?: string;
  initialError?: string | null;
  /** Gallery fixtures; in the game, visits are read from progress. */
  playedPageIds?: readonly string[];
}

/** A friend's challenge code, typed or pasted (a whole message works too). */
export const ChallengeEntry: React.FC<ChallengeEntryProps> = ({ onPlay, onPlayFriend = () => 'Chưa thể mở thử thách này.', onClose, onSignIn = () => {}, signedIn = true, initialMode = 'create', initialText = '', initialError = null, playedPageIds }) => {
  const [mode, setMode] = useState(initialMode);
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);

  const play = async () => {
    const friendCode = parseFriendCode(text);
    if (friendCode) {
      if (!signedIn) {
        setError('Đăng nhập để nhận thử thách từ bạn bè.');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        setError(onPlayFriend(await getFriendChallenge(friendCode)));
      } catch {
        setError('Không thể nhận mã này. Hãy kiểm tra mã, đăng nhập và chơi trang gốc trước.');
      } finally {
        setBusy(false);
      }
      return;
    }
    const challenge = parseChallenge(text);
    if (!challenge) {
      setError('Mã chưa đúng. Mã thử thách có dạng SG3-7K2P-142.');
      return;
    }
    setError(onPlay(challenge));
  };

  const header = (
    <View>
      <DialogHeader icon={<Swords size={22} color={colors.earth} />} title="Thử Thách Bạn Bè" onClose={onClose} />
      <View style={styles.tabs}>
        {(['create', 'receive'] as const).map((item) => (
          <Pressable key={item} onPress={() => setMode(item)} accessibilityRole="tab" accessibilityState={{ selected: mode === item }} style={[styles.tab, mode === item && styles.activeTab]}>
            <Text style={[styles.tabText, mode === item && styles.activeText]}>{item === 'create' ? 'Tạo thử thách' : 'Nhập mã'}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (mode === 'create') return <ChallengeCreate header={header} onClose={onClose} onSignIn={onSignIn} signedIn={signedIn} playedPageIds={playedPageIds} />;

  return (
    <ModalShell
      maxWidth={460}
      zIndex={360}
      backdrop="rgba(28, 24, 20, 0.74)"
      onBackdropPress={onClose}
      header={header}
      footer={(
        <View style={styles.footer}>
          {!signedIn && <SecondaryButton label="Đăng nhập để nhận thử thách" onPress={onSignIn} />}
          <PrimaryButton label={busy ? 'Đang nhận…' : 'Nhận Thử Thách'} icon={<Play size={18} color="#fff" />} onPress={() => void play()} disabled={!text.trim() || busy} />
        </View>
      )}
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
        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : <Text style={styles.hint}>Chỉ nhận thử thách của trang bạn đã chơi.</Text>}
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', marginHorizontal: 22, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  tab: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: colors.earth },
  tabText: { fontSize: 13, color: colors.inkSoft },
  activeText: { color: colors.earth, fontWeight: '700' },
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
  footer: { gap: 6 },
  error: {
    fontSize: 12.5,
    color: colors.crimson,
  },
  hint: {
    fontSize: 12,
    color: colors.inkSoft,
  },
});
