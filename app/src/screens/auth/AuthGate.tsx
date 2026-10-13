import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../platform/supabase';
import { colors, fonts } from '../../ui/theme';
import { AuthContextProvider } from './AuthContext';
import AuthScreen from './AuthScreen';

/** Keeps the game screen unmounted until Supabase has restored a signed-in session. */
export const AuthGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    void supabase.auth.getSession().then(({ data: result }) => {
      if (active) {
        setSession(result.session);
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      email: session?.user.email ?? '',
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    }),
    [session]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.earth} size="large" />
        <Text style={styles.loadingText}>Đang mở sổ ký họa…</Text>
      </View>
    );
  }

  if (!supabase || !session) return <AuthScreen configured={!!supabase} />;
  return <AuthContextProvider value={value}>{children}</AuthContextProvider>;
};

const styles = StyleSheet.create({
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
