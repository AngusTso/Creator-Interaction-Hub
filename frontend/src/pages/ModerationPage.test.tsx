import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../services/api';
import type { Event, ModerationQuestion } from '../types';
import ModerationPage from './ModerationPage';

const event: Event = {
  id: 'event-1',
  title: 'Community night',
  description: null,
  publicCode: 'a'.repeat(32),
  status: 'ACTIVE',
  createdAt: '2026-11-13T00:00:00.000Z',
  updatedAt: '2026-11-13T00:00:00.000Z',
};

const pendingQuestion: ModerationQuestion = {
  id: 'question-1',
  displayName: 'Ada',
  content: 'What inspired this project?',
  status: 'PENDING',
  eventId: event.id,
  createdAt: '2026-11-13T00:00:00.000Z',
  updatedAt: '2026-11-13T00:00:00.000Z',
};

describe('ModerationPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('updates the queue after approving and answering a question', async () => {
    vi.spyOn(api, 'getEvent').mockResolvedValue(event);
    vi.spyOn(api, 'listModerationQuestions').mockResolvedValue([pendingQuestion]);
    const updateStatus = vi.spyOn(api, 'updateQuestionStatus')
      .mockResolvedValueOnce({
        id: pendingQuestion.id,
        status: 'APPROVED',
        updatedAt: '2026-11-13T00:01:00.000Z',
      })
      .mockResolvedValueOnce({
        id: pendingQuestion.id,
        status: 'ANSWERED',
        updatedAt: '2026-11-13T00:02:00.000Z',
      });

    render(
      <ModerationPage
        accessToken="access-token"
        eventId={event.id}
        onBack={vi.fn()}
        onSessionExpired={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByRole('button', {
      name: 'Approve question from Ada',
    }));
    await waitFor(() => {
      expect(updateStatus).toHaveBeenLastCalledWith(
        'access-token',
        'question-1',
        'APPROVED',
      );
    });

    fireEvent.click(await screen.findByRole('button', {
      name: 'Mark question from Ada as answered',
    }));
    await waitFor(() => {
      expect(updateStatus).toHaveBeenLastCalledWith(
        'access-token',
        'question-1',
        'ANSWERED',
      );
    });
    expect(await screen.findByText('ANSWERED', {
      selector: '.status-badge',
    })).toBeInTheDocument();
  });
});
