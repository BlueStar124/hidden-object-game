import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cleanDisplayName, NAME_MAX, NAME_MIN } from '../../core/profile';
import { signInWithGoogle } from '../../platform/googleSignIn';
import { webAddress } from '../../platform/launchLink';
import { BookOpen, Lock, Mail, UserRound } from '../../ui/icons';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { colors, fonts, shadow } from '../../ui/theme';
import { supabase } from '../../platform/supabase';
import { RevealButton } from '../../ui/RevealButton';

// Below this height (CSS px) the full card (~580 px) would not fit: a phone held sideways, or a small one upright
const SHORT_SCREEN = 640;
// …and from this width there is room for two columns
const SPLIT_MIN_WIDTH = 560;

/** Offers account access or lets the player continue directly to the game as a guest. */
const AuthScreen: React.FC<{
  configured: boolean;
  onPlayAsGuest: () => void;
  /** The way back without an account (the game is already open behind) */
  guestLabel?: string;
  /** Opens on "Mở hồ sơ mới" (the screen tests check the taller form) */
  initialCreate?: boolean;
}> = ({ configured, onPlayAsGuest, guestLabel = 'Chơi không cần đăng nhập', initialCreate = false }) => {
  const { width, height } = useWindowDimensions();
  const [createAccount, setCreateAccount] = useState(initialCreate);
  // "Quên mật khẩu?": only the email, to send a reset link to
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const title = configured ? (forgot ? 'Quên mật khẩu' : createAccount ? 'Mở hồ sơ mới' : 'Đăng nhập') : 'Chưa kết nối';

  const sendReset = async () => {
    if (!supabase || busy || !email.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      // The email's link opens the web game, which asks for a new password (AuthGate, PasswordDialog)
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: webAddress() ?? undefined });
      // (The same answer whether the address has an account or not: it is not told to strangers)
      setMessage(error ? 'Chưa gửi được email. Hãy thử lại sau ít phút.' : 'Nếu email này có tài khoản, link đặt lại mật khẩu đã được gửi. Hãy mở email và bấm link.');
    } catch {
      setMessage('Kết nối đang gặp sự cố. Hãy thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  const signInGoogle = async () => {
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
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            // The confirmation link leads to the web game (not the project's default Site URL); it must be
            // listed in Supabase's Redirect URLs
            options: { data: { display_name: displayName }, emailRedirectTo: webAddress() ?? undefined },
          })
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

  // Phones (300–600 px tall): the whole form fits without scrolling — two columns when sideways, no
  // emblem or tagline, smaller type. The ScrollView stays for the keyboard, which covers half the screen
  const short = height < SHORT_SCREEN;
  const split = short && width >= SPLIT_MIN_WIDTH;

  const google = configured && !forgot && (
    <Pressable
      onPress={() => void signInGoogle()}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="Tiếp tục với Google"
      style={({ pressed }) => [styles.google, pressed && styles.googlePressed, busy && styles.dim]}
    >
      <View style={styles.googleMark}>
        <Text style={styles.googleLetter}>G</Text>
      </View>
      <Text style={styles.googleText}>{short ? 'Google' : 'Tiếp tục với Google'}</Text>
    </Pressable>
  );
  const guest = (
    <SecondaryButton
      label={guestLabel}
      icon={<BookOpen size={18} color={colors.earth} />}
      onPress={onPlayAsGuest}
      style={[styles.guestButton, short && styles.guestShort]}
    />
  );
  const toggleLabel = forgot
    ? 'Quay lại đăng nhập'
    : createAccount
    ? short ? 'Đăng nhập' : 'Đã có tài khoản? Đăng nhập'
    : short ? 'Tạo tài khoản' : 'Chưa có tài khoản? Tạo tài khoản';
  const field = [styles.field, short && styles.fieldShort];
  const input = [styles.input, short && styles.inputShort];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.paper, '#e7dece', colors.paper]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.scroll, short && styles.scrollShort]} keyboardShouldPersistTaps="handled">
      <View testID="dialog" style={[styles.card, short && styles.cardShort, split && styles.cardSplit]}>
        <View style={split ? styles.side : styles.column}>
          {!short && (
            <>
              <View style={styles.emblem}>
                <BookOpen size={26} color={colors.earth} />
              </View>
              <Text style={styles.eyebrow}>THE LOST SKETCHBOOK</Text>
            </>
          )}
          <Text style={[styles.title, short && styles.titleShort]}>{title}</Text>
          {!short && (
            <Text style={styles.subtitle}>
              {configured
                ? forgot
                  ? 'Nhập email đã đăng ký, mình sẽ gửi link để đặt mật khẩu mới.'
                  : createAccount
                  ? 'Tạo tài khoản để lưu hồ sơ của bạn trên thiết bị này.'
                  : 'Đăng nhập để mở cuốn sổ ký họa của bạn.'
                : 'Ứng dụng chưa được kết nối với Supabase.'}
            </Text>
          )}
          {split && google}
          {split && guest}
        </View>

        <View style={split ? styles.form : styles.column}>
          {configured ? (
            <>
              {!split && google}
              {!split && !forgot && (
                <View style={[styles.divider, short && styles.dividerShort]}>
                  <View style={styles.rule} />
                  <Text style={styles.dividerText}>hoặc dùng email</Text>
                  <View style={styles.rule} />
                </View>
              )}
              {createAccount && (
                <View style={field}>
                  <UserRound size={17} color={colors.earth} />
                  <TextInput
                    accessibilityLabel="Tên trong game"
                    autoComplete="nickname"
                    maxLength={NAME_MAX + 8}
                    onChangeText={setName}
                    placeholder={short ? 'Tên trong game' : `Tên trong game (${NAME_MIN}–${NAME_MAX} ký tự)`}
                    placeholderTextColor={colors.inkFaint}
                    returnKeyType="next"
                    style={input}
                    value={name}
                  />
                </View>
              )}
              <View style={field}>
                <Mail size={17} color={colors.earth} />
                <TextInput
                  accessibilityLabel="Địa chỉ email"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder={short ? 'Email' : 'Địa chỉ email'}
                  placeholderTextColor={colors.inkFaint}
                  returnKeyType="next"
                  style={input}
                  value={email}
                />
              </View>
              {!forgot && (
                <View style={field}>
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
                    secureTextEntry={!showPassword}
                    style={input}
                    value={password}
                  />
                  <RevealButton shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                </View>
              )}
              {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, short && styles.messageShort]}>{message}</Text>}
              {forgot ? (
                <PrimaryButton
                  label={short ? 'Gửi link' : 'Gửi link đặt lại'}
                  icon={busy ? <ActivityIndicator color="#fff" size="small" /> : <Mail size={18} color="#fff" />}
                  onPress={() => void sendReset()}
                  disabled={busy || !email.trim()}
                  style={styles.full}
                />
              ) : (
                <PrimaryButton
                  label={createAccount ? 'Tạo Tài Khoản' : short ? 'Đăng Nhập' : 'Vào Sổ Ký Họa'}
                  icon={busy ? <ActivityIndicator color="#fff" size="small" /> : <BookOpen size={18} color="#fff" />}
                  onPress={() => void submit()}
                  disabled={busy || !email.trim() || !password || (createAccount && !name.trim())}
                  style={styles.full}
                />
              )}
              {/* Short screens: both links on one line */}
              <View style={short ? styles.linksRow : styles.column}>
                {!forgot && !createAccount && (
                  <Pressable onPress={() => { setForgot(true); setMessage(''); }} accessibilityRole="button" hitSlop={6}>
                    <Text style={[styles.forgot, short && styles.linkShort]}>Quên mật khẩu?</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    if (forgot) setForgot(false);
                    else setCreateAccount((value) => !value);
                    setMessage('');
                  }}
                  accessibilityRole="button"
                  hitSlop={6}
                >
                  <Text style={[styles.toggle, short && styles.linkShort]}>{toggleLabel}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.message}>Hãy thêm địa chỉ dự án và publishable key vào cấu hình EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</Text>
          )}
          {!split && guest}
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  scrollShort: { padding: 10 },
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
  cardShort: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16 },
  cardSplit: { maxWidth: 640, flexDirection: 'row', alignItems: 'stretch', gap: 22 },
  column: { alignSelf: 'stretch', alignItems: 'center' },
  side: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: 10 },
  form: { flex: 1.2, alignItems: 'center', justifyContent: 'center' },
  emblem: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1e7d5' },
  eyebrow: { marginTop: 12, color: colors.earth, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  title: { marginTop: 5, color: colors.ink, fontFamily: fonts.displaySemiBold, fontSize: 28 },
  titleShort: { marginTop: 0, marginBottom: 2, fontSize: 21, textAlign: 'center' },
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
  fieldShort: { minHeight: 40, marginBottom: 7 },
  input: { flex: 1, minHeight: 46, color: colors.ink, fontSize: 14 },
  inputShort: { minHeight: 38, fontSize: 13 },
  messageShort: { marginVertical: 4, fontSize: 11, lineHeight: 15 },
  message: { alignSelf: 'stretch', marginVertical: 10, color: colors.crimson, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  full: { alignSelf: 'stretch', flex: 0, marginTop: 5 },
  guestButton: { alignSelf: 'stretch', flex: 0, marginTop: 12 },
  guestShort: { marginTop: 0 },
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
  dividerShort: { marginVertical: 7 },
  rule: { flex: 1, height: 1, backgroundColor: colors.hairline },
  dividerText: { color: colors.inkFaint, fontSize: 11 },
  forgot: { marginTop: 12, color: colors.inkSoft, fontSize: 12, textDecorationLine: 'underline' },
  toggle: { marginTop: 15, color: colors.earth, fontSize: 13, fontWeight: '700' },
  linksRow: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 8 },
  linkShort: { marginTop: 0, fontSize: 12 },
});
