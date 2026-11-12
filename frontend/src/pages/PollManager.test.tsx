import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../services/api';
import type { Poll } from '../types';
import PollManager from './PollManager';

const draftPoll: Poll = {
  id: 'poll-1',
  title: 'Choose a topic',
  status: 'DRAFT',
  options: [
    { id: 'option-1', text: 'Technology', votes: 0, percentage: 0 },
    { id: 'option-2', text: 'Gaming', votes: 0, percentage: 0 },
  ],
  totalVotes: 0,
  createdAt: '2026-11-13T00:00:00.000Z',
  updatedAt: '2026-11-13T00:00:00.000Z',
};

describe('PollManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a poll and activates it for an active event', async () => {
    vi.spyOn(api, 'listCreatorPolls').mockResolvedValue([]);
    const create = vi.spyOn(api, 'createPoll').mockResolvedValue(draftPoll);
    vi.spyOn(api, 'updatePollStatus').mockResolvedValue({
      ...draftPoll,
      status: 'ACTIVE',
    });

    render(
      <PollManager
        accessToken="access-token"
        eventId="event-1"
        eventStatus="ACTIVE"
        onSessionExpired={vi.fn()}
      />,
    );

    fireEvent.change(await screen.findByLabelText('POLL QUESTION'), {
      target: { value: 'Choose a topic' },
    });
    fireEvent.change(screen.getByLabelText('OPTION 1'), {
      target: { value: 'Technology' },
    });
    fireEvent.change(screen.getByLabelText('OPTION 2'), {
      target: { value: 'Gaming' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'CREATE POLL' }));

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        'access-token',
        'event-1',
        'Choose a topic',
        ['Technology', 'Gaming'],
      );
    });
    fireEvent.click(await screen.findByRole('button', { name: 'ACTIVATE POLL' }));
    await waitFor(() => {
      expect(api.updatePollStatus).toHaveBeenCalledWith(
        'access-token',
        'poll-1',
        'ACTIVE',
      );
    });
    expect(await screen.findByText('ACTIVE', {
      selector: '.status-badge',
    })).toBeInTheDocument();
  });

  it('rejects duplicate option labels in the form', async () => {
    vi.spyOn(api, 'listCreatorPolls').mockResolvedValue([]);
    const create = vi.spyOn(api, 'createPoll');

    render(
      <PollManager
        accessToken="access-token"
        eventId="event-1"
        eventStatus="DRAFT"
        onSessionExpired={vi.fn()}
      />,
    );

    fireEvent.change(await screen.findByLabelText('POLL QUESTION'), {
      target: { value: 'Choose a topic' },
    });
    fireEvent.change(screen.getByLabelText('OPTION 1'), {
      target: { value: 'Technology' },
    });
    fireEvent.change(screen.getByLabelText('OPTION 2'), {
      target: { value: ' technology ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'CREATE POLL' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '2–6 distinct options',
    );
    expect(create).not.toHaveBeenCalled();
  });
});
