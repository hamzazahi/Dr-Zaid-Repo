import { AuthContext } from './AuthContextCore';

const defaultUser = {
  name: 'Dr. Hamza Zahid',
  role: 'Chief Administrator',
  initials: 'HZ',
  email: 'admin@drzaiddental.com'
};

export const AuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider value={{ user: defaultUser, isAuthenticated: true, signIn: () => {}, signOut: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
};
