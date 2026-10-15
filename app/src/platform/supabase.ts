import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { supabaseStorage } from './supabaseStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** The public client key is intended for apps; database access still requires RLS policies. */
export const supabase =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          storage: supabaseStorage,
          autoRefreshToken: true,
          persistSession: true,
          // PKCE: a sign-in page (Google, an email link) comes back with a one-time code. On the web the
          // client reads it from the address as it starts; the apps exchange it (platform/googleSignIn)
          flowType: 'pkce',
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;

// iOS/Android: refresh the session only while the app is in the foreground (a timer in the
// background is unreliable there, and a stale token would sign the player out on return)
if (supabase && Platform.OS !== 'web') {
  const client = supabase;
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void client.auth.startAutoRefresh();
    else void client.auth.stopAutoRefresh();
  });
}
