import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cleanDisplayName, NAME_MAX, NAME_MIN } from '../../core/profile';
import { signInWithGoogle } from '../../platform/googleSignIn';
import { BookOpen, Lock, Mail, UserRound } from '../../ui/icons';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { colors, fonts, shadow } from '../../ui/theme';
import { supabase } from '../../platform/supabase';

/** Offers account access or lets the player continue directly to the game as a guest. */
const AuthScreen: React.FC<{
  configured: boolean;
  onPlayAsGuest: () => void;
  /** The way back without an account (the game is already open behind) */
  guestLabel?: string;
}> = ({ configured, onPlayAsGuest, guestLabel = 'Chơi không cần đăng nhập' }) => {
  const [createAccount, setCreateAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const title = configured ? (createAccount ? 'Mở hồ sơ mới' : 'Đăng nhập') : 'Chưa kết nối';

  const google = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      // The session arrives through the auth listener (AuthGate), as with any sign-in
      await signInWithGoogle();
    } catch {
      setMessage('Chưa đăng nhập được bằng Google. Hãy thử lại, hoặc dùng email.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!supabase || busy) return;
    // A new account carries its name in the game (core/profile), so the first visit greets the player by it
    const displayName = createAccount ? cleanDisplayName(name) : null;
    if (createAccount && !displayName) {
      setMessage(`Tên trong game cần từ ${NAME_MIN} đến ${NAME_MAX} ký tự.`);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = createAccount
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: displayName } } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (result.error) {
        setMessage(
          createAccount
            ? 'Chưa thể tạo tài khoản. Hãy kiểm tra email, mật khẩu và thử lại.'
            : 'Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại rồi thử lại.'
        );
      } else if (createAccount && !result.data.session) {
        setMessage('Tài khoản đã được tạo. Hãy mở email để xác nhận, rồi đăng nhập.');
      }
    } catch {
      setMessage('Kết nối đang gặp sự cố. Hãy thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.paper, '#e7dece', colors.paper]} style={StyleSheet.absoluteFill} />
      {/* Scrolls on a short screen (a phone held sideways, the keyboard up) */}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.emblem}>
          <BookOpen size={26} color={colors.earth} />
        </View>
        <Text style={styles.eyebrow}>THE LOST SKETCHBOOK</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {configured
            ? createAccount
              ? 'Tạo tài khoản để lưu hồ sơ của bạn trên thiết bị này.'
              : 'Đăng nhập để mở cuốn sổ ký họa của bạn.'
            : 'Ứng dụng chưa được kết nối với Supabase.'}
        </Text>

        {configured ? (
          <>
            <Pressable
              onPress={() => void google()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Tiếp tục với Google"
              style={({ pressed }) => [styles.google, pressed && styles.googlePressed, busy && styles.dim]}
            >
              <View style={styles.googleMark}>
                <Text style={styles.googleLetter}>G</Text>
              </View>
              <Text style={styles.googleText}>Tiếp tục với Google</Text>
            </Pressable>
            <View style={styles.divider}>
              <View style={styles.rule} />
              <Text style={styles.dividerText}>hoặc dùng email</Text>
              <View style={styles.rule} />
            </View>
            {createAccount && (
              <View style={styles.field}>
                <UserRound size={17} color={colors.earth} />
                <TextInput
                  accessibilityLabel="Tên trong game"
                  autoComplete="nickname"
                  maxLength={NAME_MAX + 8}
                  onChangeText={setName}
                  placeholder={`Tên trong game (${NAME_MIN}–${NAME_MAX} ký tự)`}
                  placeholderTextColor={colors.inkFaint}
                  returnKeyType="next"
                  style={styles.input}
                  value={name}
                />
              </View>
            )}
            <View style={styles.field}>
              <Mail size={17} color={colors.earth} />
              <TextInput
                accessibilityLabel="Địa chỉ email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Địa chỉ email"
                placeholderTextColor={colors.inkFaint}
                returnKeyType="next"
                style={styles.input}
                value={email}
              />
            </View>
            <View style={styles.field}>
              <Lock size={17} color={colors.earth} />
              <TextInput
                accessibilityLabel="Mật khẩu"
                autoCapitalize="none"
                autoComplete={createAccount ? 'new-password' : 'password'}
                onChangeText={setPassword}
                onSubmitEditing={() => void submit()}
                placeholder="Mật khẩu"
                placeholderTextColor={colors.inkFaint}
                returnKeyType="go"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>
            {!!message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
            <PrimaryButton
              label={createAccount ? 'Tạo Tài Khoản' : 'Vào Sổ Ký Họa'}
              icon={busy ? <ActivityIndicator color="#fff" size="small" /> : <BookOpen size={18} color="#fff" />}
              onPress={() => void submit()}
              disabled={busy || !email.trim() || !password || (createAccount && !name.trim())}
              style={styles.full}
            />
            <Pressable onPress={() => { setCreateAccount((value) => !value); setMessage(''); }} accessibilityRole="button">
              <Text style={styles.toggle}>
                {createAccount ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Tạo tài khoản'}
              </Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.message}>Hãy thêm địa chỉ dự án và publishable key vào cấu hình EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</Text>
        )}
        <SecondaryButton
          label={guestLabel}
          icon={<BookOpen size={18} color={colors.earth} />}
          onPress={onPlayAsGuest}
          style={styles.guestButton}
        />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(255, 253, 248, 0.96)',
    ...shadow(24, 0.14, 10),
  },
  emblem: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1e7d5' },
  eyebrow: { marginTop: 12, color: colors.earth, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  title: { marginTop: 5, color: colors.ink, fontFamily: fonts.displaySemiBold, fontSize: 28 },
  subtitle: { marginTop: 3, marginBottom: 17, color: colors.inkSoft, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
  field: {
    alignSelf: 'stretch',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#fff',
  },
  input: { flex: 1, minHeight: 46, color: colors.ink, fontSize: 14 },
  message: { alignSelf: 'stretch', marginVertical: 10, color: colors.crimson, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  full: { alignSelf: 'stretch', flex: 0, marginTop: 5 },
  guestButton: { alignSelf: 'stretch', flex: 0, marginTop: 12 },
  google: {
    alignSelf: 'stretch',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#fff',
  },
  googlePressed: { backgroundColor: '#f6f2ea' },
  dim: { opacity: 0.55 },
  googleMark: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.hairline },
  googleLetter: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  googleText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  divider: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  rule: { flex: 1, height: 1, backgroundColor: colors.hairline },
  dividerText: { color: colors.inkFaint, fontSize: 11 },
  toggle: { marginTop: 15, color: colors.earth, fontSize: 13, fontWeight: '700' },
});
