import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../services/api';
import type { PublicEvent, PublicQuestion } from '../types';
import PublicEventPage from './PublicEventPage';

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

describe('PublicEventPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows public questions and confirms question submission for moderation', async () => {
    vi.spyOn(api, 'getPublicEvent').mockResolvedValue(event);
    vi.spyOn(api, 'listPublicQuestions').mockResolvedValue([approvedQuestion]);
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

    expect(await screen.findByRole('status')).toHaveTextContent(
      'QUESTION RECEIVED',
    );
    expect(submit).toHaveBeenCalledWith(publicCode, 'Morgan', 'What is next?');
    expect(screen.queryByText(/PENDING/)).not.toBeInTheDocument();
  });

  it('does not offer question submission for an ended event', async () => {
    vi.spyOn(api, 'getPublicEvent').mockResolvedValue({
      ...event,
      status: 'ENDED',
    });
    vi.spyOn(api, 'listPublicQuestions').mockResolvedValue([]);

    render(<PublicEventPage publicCode={publicCode} />);

    expect(await screen.findByText(/THIS EVENT HAS ENDED/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'SUBMIT QUESTION' })).not.toBeInTheDocument();
  });
});
