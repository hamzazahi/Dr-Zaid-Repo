import { useCallback, useState } from 'react';
import { AuthContext } from './AuthContextCore';

const DEMO_EMAIL = 'admin@drzaiddental.com';
const DEMO_PASSWORD = 'admin123';
const STORAGE_KEY = 'dental-auth';

const defaultUser = {
  name: 'Dr. Hamza Zahid',
  role: 'Chief Administrator',
  initials: 'HZ',
  email: DEMO_EMAIL,
};

// A "keep me signed in" session lives in localStorage (survives a browser
// restart); a regular session lives in sessionStorage (cleared with the tab).
// Read from either so a session is restored regardless of how it was stored.
const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearStored = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable */ }
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!readStored());
  const [user, setUser] = useState(() => readStored() || null);

  // Pure credential check — the single source of truth, with no side effects.
  // Lets the UI validate before showing its success/redirect transition.
  const verifyCredentials = useCallback(
    (email, password) =>
      email?.toLowerCase().trim() === DEMO_EMAIL && password === DEMO_PASSWORD,
    []
  );

  // Verify, then commit the session. Returns a result object so callers can
  // surface an error instead of the old behaviour of silently doing nothing.
  const signIn = useCallback(
    ({ email, password, keepSignedIn }) => {
      if (!verifyCredentials(email, password)) {
        return { ok: false, error: 'Incorrect email or password. Please try again.' };
      }

      setIsAuthenticated(true);
      setUser(defaultUser);
      try {
        const store = keepSignedIn ? localStorage : sessionStorage;
        const other = keepSignedIn ? sessionStorage : localStorage;
        store.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
        other.removeItem(STORAGE_KEY); // never leave a stale copy in the other store
      } catch { /* storage unavailable */ }

      return { ok: true };
    },
    [verifyCredentials]
  );

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    clearStored();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, verifyCredentials, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
