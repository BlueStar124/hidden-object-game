import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

/**
 * Sign-in with Google on iOS/Android: Google's page opens in the system browser, which comes back to
 * the app by its own link (app.json `scheme`; in Expo Go, its exp:// address) with a one-time code,
 * exchanged for a session (PKCE: platform/supabase). The session then arrives as any sign-in does.
 * Resolves false when the player closes the page; rejects when it cannot be done.
 */
export async function signInWithGoogle(): Promise<boolean> {
  if (!supabase) throw new Error('Supabase is not configured');
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data.url) throw error ?? new Error('No sign-in page');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;
  // (Read by hand: React Native's URL has no searchParams)
  const param = (name: string) => {
    const match = new RegExp(`[?&#]${name}=([^&#]*)`).exec(result.url);
    return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
  };
  const code = param('code');
  if (!code) throw new Error(param('error_description') ?? 'No sign-in code');
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}
