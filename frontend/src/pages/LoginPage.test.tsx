import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../services/api';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submits creator credentials and returns the session', async () => {
    const login = vi.spyOn(api, 'login').mockResolvedValue({
      user: { id: 'creator-1', username: 'streamer' },
      accessToken: 'access-token',
    });
    const onLogin = vi.fn();
    const user = userEvent.setup();

    render(<LoginPage onLogin={onLogin} />);
    await user.type(screen.getByLabelText('USERNAME'), 'streamer');
    await user.type(screen.getByLabelText('PASSWORD'), 'secret');
    await user.click(screen.getByRole('button', { name: 'SIGN IN' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('streamer', 'secret');
      expect(onLogin).toHaveBeenCalledWith(
        { id: 'creator-1', username: 'streamer' },
        'access-token',
      );
    });
  });

  it('shows authentication failures without losing the form', async () => {
    vi.spyOn(api, 'login').mockRejectedValue(
      new Error('Invalid username or password.'),
    );
    const user = userEvent.setup();

    render(<LoginPage onLogin={vi.fn()} />);
    await user.type(screen.getByLabelText('USERNAME'), 'streamer');
    await user.type(screen.getByLabelText('PASSWORD'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'SIGN IN' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid username or password.',
    );
    expect(screen.getByLabelText(/USERNAME/)).toHaveValue('streamer');
  });
});
