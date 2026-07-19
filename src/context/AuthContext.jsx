import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from './AuthContextCore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Authentication provider.
//
// LIVE mode (Supabase configured): real email/password auth. The user's role
// (doctor | receptionist) comes from the `profiles` table and drives both the
// UI gating and - via RLS - what the database itself will allow.
//
// DEMO mode (no .env): the original in-browser accounts, so the app still
// runs standalone for development and demos.

const STORAGE_KEY = 'dental-auth';

const DEMO_ACCOUNTS = {
  'admin@drzaiddental.com': {
    password: 'admin123',
    profile: { name: 'Dr. Hamza Zahid', role: 'doctor', roleLabel: 'Doctor', initials: 'HZ' },
  },
  'reception@drzaiddental.com': {
    password: 'reception123',
    profile: { name: 'Bilal Hussain', role: 'receptionist', roleLabel: 'Receptionist', initials: 'BH' },
  },
};

const roleLabelOf = (role) => (role === 'doctor' ? 'Doctor' : role === 'receptionist' ? 'Receptionist' : role);

const readDemoStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearDemoStored = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable */ }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => (isSupabaseConfigured ? null : readDemoStored()));
  // Live mode restores the session asynchronously - gate the first paint.
  const [initializing, setInitializing] = useState(isSupabaseConfigured);
  // True while the user is following a password-reset email link: the app shows
  // the "set new password" screen instead of the dashboard, even though a
  // (recovery) session technically exists.
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let cancelled = false;

    // Resolve a Supabase session into our app user (profile row = role).
    const applySession = async (session) => {
      if (!session?.user) {
        if (!cancelled) { setUser(null); setInitializing(false); }
        return;
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('name, role, initials')
        .eq('id', session.user.id)
        .single();
      if (cancelled) return;
      setUser({
        email: session.user.email,
        name: prof?.name || session.user.email,
        role: prof?.role || 'receptionist',
        roleLabel: roleLabelOf(prof?.role || 'receptionist'),
        initials: prof?.initials || (prof?.name || 'U').slice(0, 2).toUpperCase(),
      });
      setInitializing(false);
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // A password-reset link fires PASSWORD_RECOVERY with a temporary session.
      // Show the reset screen instead of logging the user straight in.
      if (event === 'PASSWORD_RECOVERY') {
        if (!cancelled) { setRecovery(true); setInitializing(false); }
        return;
      }
      applySession(session);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password, keepSignedIn }) => {
    const normalized = email?.toLowerCase().trim();

    // ── Demo mode ──
    if (!isSupabaseConfigured) {
      const account = DEMO_ACCOUNTS[normalized];
      if (!account || account.password !== password) {
        return { ok: false, error: 'Incorrect email or password. Please try again.' };
      }
      const demoUser = { email: normalized, ...account.profile };
      setUser(demoUser);
      try {
        const store = keepSignedIn ? localStorage : sessionStorage;
        const other = keepSignedIn ? sessionStorage : localStorage;
        store.setItem(STORAGE_KEY, JSON.stringify(demoUser));
        other.removeItem(STORAGE_KEY);
      } catch { /* storage unavailable */ }
      return { ok: true };
    }

    // ── Live mode ──
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) {
      return {
        ok: false,
        error: /invalid login credentials/i.test(error.message)
          ? 'Incorrect email or password. Please try again.'
          : error.message,
      };
    }
    // A login without a staff profile has no role - refuse it with guidance
    // rather than guessing permissions.
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
    if (!prof) {
      await supabase.auth.signOut();
      return { ok: false, error: 'This login has no staff profile yet. Run the profiles INSERT from BACKEND.md (step 2).' };
    }
    return { ok: true }; // onAuthStateChange populates the user
  }, []);

  // Send a password-reset email. The link brings the user back to the app,
  // where onAuthStateChange fires PASSWORD_RECOVERY and shows the reset screen.
  const requestPasswordReset = useCallback(async (email) => {
    const normalized = email?.toLowerCase().trim();
    if (!normalized) return { ok: false, error: 'Please enter your email address.' };
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Email password reset is available once the clinic is connected. Please ask your administrator to reset it for you.' };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: window.location.origin,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  // Set the new password for the recovery session, then sign out so the user
  // logs in fresh with it.
  const completePasswordReset = useCallback(async (newPassword) => {
    if (!isSupabaseConfigured) return { ok: false, error: 'Not available in demo mode.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    await supabase.auth.signOut();
    setRecovery(false);
    setUser(null);
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    clearDemoStored();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), initializing, recovery, signIn, signOut, requestPasswordReset, completePasswordReset, isLiveAuth: isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};
