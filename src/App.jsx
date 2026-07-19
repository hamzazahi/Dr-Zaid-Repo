import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';
import SignIn from './pages/SignIn';
import ResetPassword from './pages/ResetPassword';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  const { isAuthenticated, initializing, recovery } = useAuth();

  // Live auth restores the session asynchronously on load - show a quiet
  // branded splash instead of flashing the sign-in page at returning users.
  if (initializing) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: '#F8FAFC' }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '11px', background: 'linear-gradient(180deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9.5" y="3" width="5" height="18" rx="2" fill="#fff" />
            <rect x="3" y="9.5" width="18" height="5" rx="2" fill="#fff" />
          </svg>
        </Box>
        <CircularProgress size={22} thickness={4} />
        <Typography sx={{ fontSize: '0.8rem', color: '#64748B' }}>Loading your workspace…</Typography>
      </Box>
    );
  }

  // Following a password-reset email link takes priority over everything else.
  if (recovery) {
    return <ResetPassword />;
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <Layout>
      {/* Boundary wraps only the routed page, so a crash leaves the
          sidebar/header usable and the user can navigate away. */}
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </Layout>
  );
}
