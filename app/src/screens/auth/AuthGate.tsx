import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { displayNameOf } from '../../core/profile';
import { hasEntered, rememberEntered } from '../../platform/accountPrefs';
import { connectCloudProgress, type CloudSync } from '../../platform/cloudProgress';
import { takeAuthLink } from '../../platform/launchLink';
import { supabase } from '../../platform/supabase';
import { colors, fonts } from '../../ui/theme';
import { AuthContextProvider } from './AuthContext';
import AuthScreen from './AuthScreen';
import { NameDialog } from './NameDialog';
import { AuthNotice, PasswordDialog } from './PasswordDialog';

// A sign-in waits this long for the account's progress, then the game opens anyway (sync goes on)
const SYNC_WAIT_MS = 4000;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Accounts around the game, never in its way: the sign-in screen shows on the very first launch
 * only (or when the player asks for it); after that the game opens at once, offline included, and a
 * saved session syncs in the background (platform/cloudProgress).
 */
export const AuthGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [entered, setEntered] = useState(() => !supabase || hasEntered());
  const [accountOpen, setAccountOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  // "Để sau" on the first ask: not asked again until the app opens next time
  const [nameLater, setNameLater] = useState(false);
  // Opened from a reset-password email: a new password is asked for
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<{ title: string; text: string } | null>(null);
  // Bumped once a sign-in has brought the account's progress: the game opens again with it
  const [generation, setGeneration] = useState(0);
  const sync = useRef<CloudSync | null>(null);
  const asking = !entered || accountOpen;
  const askingRef = useRef(asking);
  askingRef.current = asking;

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next);
    });
    // Opened from an account email (web): the link is verified here, so it works in any browser
    const link = takeAuthLink();
    if (link) {
      supabase.auth
        .verifyOtp({ token_hash: link.tokenHash, type: link.type })
        .then(({ error }) => {
          if (!active) return;
          if (error) {
            setNotice({
              title: 'Link đã hết hạn',
              text:
                link.type === 'recovery'
                  ? 'Link đặt lại mật khẩu đã được dùng hoặc đã hết hạn. Hãy bấm "Quên mật khẩu?" để nhận link mới.'
                  : 'Link xác nhận đã được dùng hoặc đã hết hạn. Nếu email đã được xác nhận, bạn cứ đăng nhập bằng email và mật khẩu.',
            });
          } else if (link.type === 'recovery') setResetting(true);
        })
        .catch(() => {
          if (active) setNotice({ title: 'Chưa kết nối được', text: 'Hãy kiểm tra mạng rồi mở lại link trong email.' });
        });
    }
    supabase.auth
      .getSession()
      .then(({ data: result }) => {
        if (active) setSession(result.session);
      })
      .catch(() => {});
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    const current = connectCloudProgress(userId);
    sync.current = current;
    let active = true;
    // Signed in on the sign-in screen just now (a session restored at launch syncs quietly)
    if (askingRef.current) {
      setSyncing(true);
      void Promise.race([current.ready, wait(SYNC_WAIT_MS)]).then(() => {
        if (!active) return;
        rememberEntered();
        setSyncing(false);
        setEntered(true);
        setAccountOpen(false);
        setGeneration((n) => n + 1);
      });
    }
    return () => {
      active = false;
      current.stop();
      if (sync.current === current) sync.current = null;
    };
  }, [userId]);

  // The name in the game: chosen, or the sign-in provider's (core/profile); none yet: asked for once
  const name = displayNameOf(session?.user.user_metadata);
  const saveName = async (next: string): Promise<string | null> => {
    if (!supabase) return 'Chưa kết nối máy chủ.';
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: next } });
      return error ? 'Chưa lưu được tên. Hãy kiểm tra kết nối rồi thử lại.' : null;
    } catch {
      return 'Chưa lưu được tên. Hãy kiểm tra kết nối rồi thử lại.';
    }
  };

  const value = useMemo(
    () => ({
      email: session?.user.email ?? '',
      name,
      openAccount: () => setAccountOpen(true),
      editName: () => setEditingName(true),
      signOut: async () => {
        if (!supabase) return;
        const current = sync.current;
        if (current) await Promise.race([current.flush(), wait(SYNC_WAIT_MS)]);
        // This device only: works offline too (a global sign-out needs the server)
        await supabase.auth.signOut({ scope: 'local' });
      },
    }),
    [session, name]
  );

  const savePassword = async (password: string): Promise<string | null> => {
    if (!supabase) return 'Chưa kết nối máy chủ.';
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return 'Chưa đổi được mật khẩu. Hãy thử mật khẩu khác, hoặc kiểm tra kết nối.';
      setNotice({ title: 'Đã đổi mật khẩu', text: 'Lần sau bạn đăng nhập bằng mật khẩu mới này.' });
      return null;
    } catch {
      return 'Chưa đổi được mật khẩu. Hãy kiểm tra kết nối rồi thử lại.';
    }
  };

  const playAsGuest = () => {
    rememberEntered();
    setEntered(true);
    setAccountOpen(false);
  };

  return (
    <View style={styles.root}>
      {entered && (
        <AuthContextProvider key={generation} value={value}>
          {children}
        </AuthContextProvider>
      )}
      {asking && (
        <View style={StyleSheet.absoluteFill}>
          {syncing ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.earth} size="large" />
              <Text style={styles.loadingText}>Đang đồng bộ tiến độ…</Text>
            </View>
          ) : (
            <AuthScreen configured={!!supabase} onPlayAsGuest={playAsGuest} guestLabel={entered ? 'Quay lại sổ ký họa' : undefined} />
          )}
        </View>
      )}
      {!asking && !resetting && session && (editingName || (!name && !nameLater)) && (
        <NameDialog
          initial={name ?? ''}
          required={!name}
          onSave={saveName}
          onClose={() => {
            setEditingName(false);
            setNameLater(true);
          }}
        />
      )}
      {resetting && session && <PasswordDialog onSave={savePassword} onClose={() => setResetting(false)} />}
      {notice && !resetting && <AuthNotice title={notice.title} text={notice.text} onClose={() => setNotice(null)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.paper,
  },
  loadingText: {
    color: colors.inkSoft,
    fontFamily: fonts.body,
    fontSize: 14,
  },
});
