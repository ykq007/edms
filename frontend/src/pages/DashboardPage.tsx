import { useAuthStore } from '../features/auth/store/authStore.ts';

export function DashboardPage() {
  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout,
  }));

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1>Dashboard</h1>
        <p>
          You are signed in{user ? ` as ${user.email}` : ''}. This is a protected route example guarded by the auth store.
        </p>
      </div>

      <button type="button" onClick={logout} className="secondary-button">
        Sign out
      </button>
    </div>
  );
}
