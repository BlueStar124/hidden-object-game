import { supabase } from './supabase';

/**
 * Sign-in with Google on the web: the page goes to Google and comes back to this same address with a
 * one-time code, which the Supabase client exchanges for a session as it starts (detectSessionInUrl).
 * Resolves only if the page could not leave (it normally does).
 */
export async function signInWithGoogle(): Promise<boolean> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
  });
  if (error) throw error;
  return true;
}
