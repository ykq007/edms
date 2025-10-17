import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm.tsx';
import { useAuthStore } from '../features/auth/store/authStore.ts';

export function LoginPage() {
  const navigate = useNavigate();
  const { token, hasHydrated } = useAuthStore((state) => ({
    token: state.token,
    hasHydrated: state.hasHydrated,
  }));

  useEffect(() => {
    if (hasHydrated && token) {
      navigate('/', { replace: true });
    }
  }, [hasHydrated, token, navigate]);

  return (
    <div className="auth-page">
      <LoginForm />
    </div>
  );
}
