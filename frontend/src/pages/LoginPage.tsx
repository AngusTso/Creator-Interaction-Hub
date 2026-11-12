import { useState, type FormEvent } from 'react';
import { getErrorMessage, login, registerCreator } from '../services/api';
import type { Creator } from '../types';

interface Props {
  notice?: string | null;
  onLogin: (creator: Creator, accessToken: string) => void;
}

export default function LoginPage({ notice, onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = isRegistering
        ? await registerCreator(username.trim(), password)
        : await login(username.trim(), password);
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
        <h1 id="login-title">{isRegistering ? 'CREATE ACCOUNT.' : 'SIGN IN.'}</h1>
        <p className="body-copy">
          {isRegistering
            ? 'Create a creator account to manage your events.'
            : 'Sign in to create events and moderate questions.'}
        </p>

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
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              minLength={isRegistering ? 12 : undefined}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button className="button button--primary button--wide" disabled={isSubmitting}>
            {isSubmitting
              ? (isRegistering ? 'CREATING…' : 'SIGNING IN…')
              : (isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN')}
          </button>
        </form>

        <p className="fine-print">
          {isRegistering
            ? 'PASSWORD / 12 CHARACTERS MINIMUM'
            : 'CREATOR ACCOUNT / DEMO ACCESS AVAILABLE'}
        </p>
        <button
          className="text-button auth-mode-toggle"
          onClick={() => {
            setIsRegistering((current) => !current);
            setError(null);
          }}
          type="button"
        >
          {isRegistering ? 'HAVE AN ACCOUNT? SIGN IN' : 'NEW CREATOR? SIGN UP'}
        </button>
      </section>
    </main>
  );
}
