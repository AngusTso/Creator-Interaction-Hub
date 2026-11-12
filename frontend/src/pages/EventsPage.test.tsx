import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../services/api';
import type { Event } from '../types';
import EventsPage from './EventsPage';

const draftEvent: Event = {
  id: 'event-1',
  title: 'Community night',
  description: 'Questions from the audience.',
  publicCode: 'a'.repeat(32),
  status: 'DRAFT',
  createdAt: '2026-11-13T00:00:00.000Z',
  updatedAt: '2026-11-13T00:00:00.000Z',
};

const props = {
  accessToken: 'access-token',
  creator: { id: 'creator-1', username: 'streamer' },
  onLogout: vi.fn(),
  onSessionExpired: vi.fn(),
  onOpenEvent: vi.fn(),
};

describe('EventsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an event and activates it', async () => {
    vi.spyOn(api, 'listEvents').mockResolvedValue([]);
    vi.spyOn(api, 'createEvent').mockResolvedValue(draftEvent);
    vi.spyOn(api, 'updateEventStatus').mockResolvedValue({
      ...draftEvent,
      status: 'ACTIVE',
    });

    render(<EventsPage {...props} />);
    fireEvent.change(await screen.findByLabelText(/EVENT TITLE/), {
      target: { value: 'Community night' },
    });
    fireEvent.change(screen.getByLabelText(/DESCRIPTION/), {
      target: { value: 'Questions from the audience.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'CREATE EVENT' }));

    expect(await screen.findByText('Community night')).toBeInTheDocument();
    expect(api.createEvent).toHaveBeenCalledWith(
      'access-token',
      'Community night',
      'Questions from the audience.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'ACTIVATE EVENT' }));
    await waitFor(() => {
      expect(api.updateEventStatus).toHaveBeenCalledWith(
        'access-token',
        'event-1',
        'ACTIVE',
      );
    });
    expect(await screen.findByText('ACTIVE')).toBeInTheDocument();
  });
});
