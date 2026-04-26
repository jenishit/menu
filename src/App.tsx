import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import MenuPage   from './pages/menu/MenuPage';
import LoginPage  from './pages/LoginPage';
import AdminPage  from './pages/admin/AdminPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted text-xs tracking-[0.3em] uppercase animate-pulse">
        Checking credentials…
      </p>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"       element={<MenuPage />} />
      <Route path="/login"  element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}