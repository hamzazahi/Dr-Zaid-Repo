import { useState } from 'react';
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

const readStored = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!readStored());
  const [user, setUser] = useState(() => readStored() || null);

  const signIn = ({ email, keepSignedIn }) => {
    if (email?.toLowerCase().trim() === DEMO_EMAIL && keepSignedIn !== undefined) {
      setIsAuthenticated(true);
      setUser(defaultUser);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser)); } catch {}
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
