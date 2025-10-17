import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore.ts';

export function ProtectedRoute() {
  const location = useLocation();
  const { token, hasHydrated } = useAuthStore((state) => ({
    token: state.token,
    hasHydrated: state.hasHydrated,
  }));

  if (!hasHydrated) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
