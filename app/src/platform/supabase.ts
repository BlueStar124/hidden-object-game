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
          detectSessionInUrl: false,
        },
      })
    : null;
