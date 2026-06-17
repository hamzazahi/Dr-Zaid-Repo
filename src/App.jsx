import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';
import SignIn from './pages/SignIn';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}
