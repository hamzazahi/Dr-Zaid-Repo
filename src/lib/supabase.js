import { createClient } from '@supabase/supabase-js';

// Single Supabase client for the whole app.
//
// Reads config from Vite env (.env — see .env.example). Until the env vars
// are set, `supabase` is null and `isSupabaseConfigured` is false: the app
// keeps running on the local (mock/localStorage) data layer, so the backend
// can be adopted module-by-module without ever breaking the frontend.

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes('YOUR-PROJECT-REF') && !anonKey.includes('PASTE-YOUR')
);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'dentsuite-auth',
      },
    })
  : null;
