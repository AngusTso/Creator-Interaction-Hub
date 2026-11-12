import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../services/api';
import type { Poll, PublicEvent, PublicQuestion } from '../types';
import PublicEventPage from './PublicEventPage';

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

const publicCode = 'a'.repeat(32);
const event: PublicEvent = {
  title: 'Community night',
  description: 'Questions from the audience.',
  publicCode,
  status: 'ACTIVE',
};
const approvedQuestion: PublicQuestion = {
  id: 'question-1',
  displayName: 'Ada',
  content: 'What inspired this project?',
  status: 'APPROVED',
  createdAt: '2026-11-13T00:00:00.000Z',
};
const activePoll: Poll = {
  id: 'poll-1',
  title: 'Choose a topic',
  status: 'ACTIVE',
  options: [
    { id: 'option-1', text: 'Technology', votes: 0, percentage: 0 },
    { id: 'option-2', text: 'Gaming', votes: 0, percentage: 0 },
  ],
  totalVotes: 0,
  createdAt: '2026-11-13T00:00:00.000Z',
  updatedAt: '2026-11-13T00:00:00.000Z',
};

describe('PublicEventPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    socketMock.on.mockReset();
    socketMock.emit.mockReset();
    socketMock.disconnect.mockReset();
    localStorage.clear();
  });

  it('shows public questions and confirms question submission for moderation', async () => {
    vi.spyOn(api, 'getPublicEvent').mockResolvedValue(event);
    vi.spyOn(api, 'listPublicQuestions').mockResolvedValue([approvedQuestion]);
    vi.spyOn(api, 'listPublicPolls').mockResolvedValue([]);
    const submit = vi.spyOn(api, 'submitQuestion').mockResolvedValue();

    render(<PublicEventPage publicCode={publicCode} />);
    expect(await screen.findByText('What inspired this project?')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/DISPLAY NAME/), {
      target: { value: 'Morgan' },
    });
    fireEvent.change(screen.getByLabelText('QUESTION'), {
      target: { value: 'What is next?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'SUBMIT QUESTION' }));

    expect(await screen.findByText(/QUESTION RECEIVED/)).toBeInTheDocument();
    expect(submit).toHaveBeenCalledWith(publicCode, 'Morgan', 'What is next?');
    expect(screen.queryByText(/PENDING/)).not.toBeInTheDocument();
  });

  it('does not offer question submission for an ended event', async () => {
    vi.spyOn(api, 'getPublicEvent').mockResolvedValue({
      ...event,
      status: 'ENDED',
    });
    vi.spyOn(api, 'listPublicQuestions').mockResolvedValue([]);
    vi.spyOn(api, 'listPublicPolls').mockResolvedValue([]);

    render(<PublicEventPage publicCode={publicCode} />);

    expect(await screen.findByText(/THIS EVENT HAS ENDED/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'SUBMIT QUESTION' })).not.toBeInTheDocument();
  });

  it('keeps the public page frame visible while initial data loads', () => {
    vi.spyOn(api, 'getPublicEvent').mockImplementation(
      () => new Promise<PublicEvent>(() => {}),
    );
    vi.spyOn(api, 'listPublicQuestions').mockImplementation(
      () => new Promise<PublicQuestion[]>(() => {}),
    );
    vi.spyOn(api, 'listPublicPolls').mockImplementation(
      () => new Promise<Poll[]>(() => {}),
    );

    render(<PublicEventPage publicCode={publicCode} />);

    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('CREATOR / INTERACTION HUB')).toBeInTheDocument();
    expect(screen.getByText('LOADING EVENT AND QUESTIONS')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('joins the audience room and refreshes after question status notifications', async () => {
    vi.spyOn(api, 'getPublicEvent').mockResolvedValue(event);
    vi.spyOn(api, 'listPublicQuestions').mockResolvedValue([approvedQuestion]);
    vi.spyOn(api, 'listPublicPolls').mockResolvedValue([]);

    render(<PublicEventPage publicCode={publicCode} />);
    await screen.findByText('What inspired this project?');

    const connectHandler = socketMock.on.mock.calls.find(
      ([eventName]) => eventName === 'connect',
    )?.[1];
    const statusHandler = socketMock.on.mock.calls.find(
      ([eventName]) => eventName === 'question:status',
    )?.[1];
    expect(connectHandler).toBeTypeOf('function');
    expect(statusHandler).toBeTypeOf('function');

    await act(async () => {
      connectHandler?.();
    });
    expect(socketMock.emit).toHaveBeenCalledWith('audience:join', publicCode);

    await act(async () => {
      statusHandler?.({ eventId: 'event-1' });
    });
    await waitFor(() => {
      expect(api.listPublicQuestions).toHaveBeenCalledTimes(2);
    });
  });

  it('submits one vote with the browser key and displays updated results', async () => {
    const voterKey = '1c2b9e57-8d35-4b9e-90e8-76b0c9d0b1f1';
    localStorage.setItem('creator-interaction-hub:voter-key', voterKey);
    vi.spyOn(api, 'getPublicEvent').mockResolvedValue(event);
    vi.spyOn(api, 'listPublicQuestions').mockResolvedValue([]);
    vi.spyOn(api, 'listPublicPolls').mockResolvedValue([activePoll]);
    const updatedPoll: Poll = {
      ...activePoll,
      options: [
        { ...activePoll.options[0], votes: 1, percentage: 100 },
        activePoll.options[1],
      ],
      totalVotes: 1,
    };
    const vote = vi.spyOn(api, 'submitPollVote').mockResolvedValue(updatedPoll);

    render(<PublicEventPage publicCode={publicCode} />);
    await screen.findByText('Choose a topic');
    fireEvent.click(screen.getByRole('radio', { name: 'Technology' }));
    fireEvent.click(screen.getByRole('button', { name: 'SUBMIT VOTE' }));

    await waitFor(() => {
      expect(vote).toHaveBeenCalledWith('poll-1', 'option-1', voterKey);
    });
    expect(await screen.findByText('1 / 100%')).toBeInTheDocument();
    expect(await screen.findByText('YOUR VOTE IS RECORDED.')).toBeInTheDocument();
  });
});
