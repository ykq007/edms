import { FormEvent, useState } from 'react';
import { useLoginMutation } from '../hooks/useLoginMutation.ts';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate, isPending, error } = useLoginMutation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="auth-card">
      <header>
        <h1>Welcome back</h1>
        <p>Sign in with your credentials to continue.</p>
      </header>

      <label className="form-label" htmlFor="email">
        Email
        <input
          id="email"
          className="text-input"
          type="email"
          name="email"
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="form-label" htmlFor="password">
        Password
        <input
          id="password"
          className="text-input"
          type="password"
          name="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {error ? (
        <p className="error-text" role="alert">
          {error.message || 'Unable to sign in. Please try again.'}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="primary-button">
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
