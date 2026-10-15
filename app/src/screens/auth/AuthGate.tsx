import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { hasEntered, rememberEntered } from '../../platform/accountPrefs';
import { connectCloudProgress, type CloudSync } from '../../platform/cloudProgress';
import { supabase } from '../../platform/supabase';
import { colors, fonts } from '../../ui/theme';
import { AuthContextProvider } from './AuthContext';
import AuthScreen from './AuthScreen';

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

  const value = useMemo(
    () => ({
      email: session?.user.email ?? '',
      openAccount: () => setAccountOpen(true),
      signOut: async () => {
        if (!supabase) return;
        const current = sync.current;
        if (current) await Promise.race([current.flush(), wait(SYNC_WAIT_MS)]);
        // This device only: works offline too (a global sign-out needs the server)
        await supabase.auth.signOut({ scope: 'local' });
      },
    }),
    [session]
  );

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
