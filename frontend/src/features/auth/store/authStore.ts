import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setAuthTokenProvider } from '../../../api/client.ts';

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

export type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const storage = typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      login: (token, user) =>
        set({
          token,
          user,
          hasHydrated: true,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          hasHydrated: true,
        }),
    }),
    {
      name: 'auth-storage',
      storage,
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);

setAuthTokenProvider(() => useAuthStore.getState().token);

useAuthStore.persist.onFinishHydration((state) => {
  useAuthStore.setState({
    token: state?.token ?? null,
    user: state?.user ?? null,
    hasHydrated: true,
  });
});

useAuthStore.persist.onHydrateError(() => {
  useAuthStore.setState({
    token: null,
    user: null,
    hasHydrated: true,
  });
});
