import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../services/api';
import type { Event, ModerationQuestion } from '../types';
import ModerationPage from './ModerationPage';

const { socketMock } = vi.hoisted(() => ({
  socketMock: {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => socketMock),
}));

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
    socketMock.on.mockReset();
    socketMock.emit.mockReset();
    socketMock.disconnect.mockReset();
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

  it('joins the event room and refreshes the queue on question notifications', async () => {
    vi.spyOn(api, 'getEvent').mockResolvedValue(event);
    const loadQuestions = vi.spyOn(api, 'listModerationQuestions')
      .mockResolvedValue([pendingQuestion]);

    render(
      <ModerationPage
        accessToken="access-token"
        eventId={event.id}
        onBack={vi.fn()}
        onSessionExpired={vi.fn()}
      />,
    );

    await waitFor(() => expect(loadQuestions).toHaveBeenCalledTimes(1));
    const connectHandler = socketMock.on.mock.calls.find(
      ([eventName]) => eventName === 'connect',
    )?.[1];
    const questionHandler = socketMock.on.mock.calls.find(
      ([eventName]) => eventName === 'question:created',
    )?.[1];

    expect(connectHandler).toBeTypeOf('function');
    expect(questionHandler).toBeTypeOf('function');

    await act(async () => {
      connectHandler?.();
    });
    expect(socketMock.emit).toHaveBeenCalledWith('moderation:join', event.id);

    await act(async () => {
      questionHandler?.({ eventId: event.id });
    });
    await waitFor(() => expect(loadQuestions).toHaveBeenCalledTimes(2));

    await act(async () => {
      connectHandler?.();
    });
    await waitFor(() => expect(loadQuestions).toHaveBeenCalledTimes(3));
    expect(socketMock.emit).toHaveBeenCalledTimes(2);
  });
});
