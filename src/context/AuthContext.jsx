import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContextCore';

const AUTH_STORAGE_KEY = 'dental-clinic-auth';

const defaultUser = {
  name: 'Dr. Hamza Zahid',
  role: 'Chief Administrator',
  initials: 'HZ',
  email: 'admin@drzaiddental.com'
};

const readStoredSession = () => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [storedSession] = useState(() => readStoredSession());
  const [user, setUser] = useState(storedSession?.user || null);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const signIn = ({ email }) => {
    const nextUser = {
      ...defaultUser,
      email: email || defaultUser.email
    };
    setUser(nextUser);
    return nextUser;
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
