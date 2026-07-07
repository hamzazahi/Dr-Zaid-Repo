import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';
import SignIn from './pages/SignIn';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  const { isAuthenticated } = useAuth();

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
