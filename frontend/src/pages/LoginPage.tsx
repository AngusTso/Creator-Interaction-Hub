import { useState, type FormEvent } from 'react';
import { getErrorMessage, login } from '../services/api';
import type { Creator } from '../types';

interface Props {
  notice?: string | null;
  onLogin: (creator: Creator, accessToken: string) => void;
}

export default function LoginPage({ notice, onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(username.trim(), password);
      onLogin(result.user, result.accessToken);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to sign in.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <a className="brand login-brand" href="#/" aria-label="Creator Interaction Hub">
          <span className="brand-mark" aria-hidden="true">CH</span>
          <span className="brand-name">CREATOR / INTERACTION HUB</span>
        </a>
        <p className="eyebrow">CREATOR ACCESS / 01</p>
        <h1 id="login-title">SIGN IN.</h1>
        <p className="body-copy">Sign in to create events and moderate questions.</p>

        {notice && <p className="notice" role="status">{notice}</p>}
        {error && <p className="message message--error" role="alert">{error}</p>}

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>USERNAME</span>
            <input
              autoComplete="username"
              maxLength={100}
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>
          <label className="field">
            <span>PASSWORD</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button className="button button--primary button--wide" disabled={isSubmitting}>
            {isSubmitting ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>

        <p className="fine-print">CREATOR ACCOUNT REQUIRED / NO PUBLIC SIGN-UP</p>
      </section>
    </main>
  );
}
