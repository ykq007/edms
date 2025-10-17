import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../api/login.ts';
import type { LoginPayload } from '../api/login.ts';
import { useAuthStore } from '../store/authStore.ts';

export function useLoginMutation() {
  const navigate = useNavigate();
  const location = useLocation();
  const authActions = useAuthStore((state) => ({
    login: state.login,
  }));

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: ({ token, user }) => {
      authActions.login(token, user);
      type LocationState = { from?: { pathname?: string } };
      const redirectPath = ((location.state as LocationState | undefined)?.from?.pathname) ?? '/';
      navigate(redirectPath, { replace: true });
    },
  });
}
