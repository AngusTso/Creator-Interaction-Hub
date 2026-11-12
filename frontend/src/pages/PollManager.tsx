import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError,
  createPoll,
  getErrorMessage,
  listCreatorPolls,
  updatePollStatus,
} from '../services/api';
import type { EventStatus, Poll, PollStatus } from '../types';

interface Props {
  accessToken: string;
  eventId: string;
  eventStatus: EventStatus;
  onSessionExpired: () => void;
}

function isSessionExpired(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export default function PollManager({
  accessToken,
  eventId,
  eventStatus,
  onSessionExpired,
}: Props) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [busyPollId, setBusyPollId] = useState<string | null>(null);

  const loadPolls = useCallback(async () => {
    try {
      setPolls(await listCreatorPolls(accessToken, eventId));
    } catch (requestError) {
      if (isSessionExpired(requestError)) {
        onSessionExpired();
      } else {
        setError(getErrorMessage(requestError, 'Unable to load polls.'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, eventId, onSessionExpired]);

  useEffect(() => {
    void loadPolls();
  }, [loadPolls]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedTitle = title.trim();
    const trimmedOptions = options.map((option) => option.trim());
    if (
      !trimmedTitle ||
      trimmedOptions.length < 2 ||
      trimmedOptions.some((option) => !option) ||
      new Set(trimmedOptions.map((option) => option.toLowerCase())).size !==
        trimmedOptions.length
    ) {
      setError('Add a title and 2–6 distinct options.');
      return;
    }

    setIsCreating(true);
    try {
      const poll = await createPoll(
        accessToken,
        eventId,
        trimmedTitle,
        trimmedOptions,
      );
      setPolls((currentPolls) => [poll, ...currentPolls]);
      setTitle('');
      setOptions(['', '']);
      setNotice('POLL CREATED. ACTIVATE IT WHEN THE EVENT IS LIVE.');
    } catch (requestError) {
      if (isSessionExpired(requestError)) {
        onSessionExpired();
      } else {
        setError(getErrorMessage(requestError, 'Unable to create the poll.'));
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStatusChange(poll: Poll, status: Exclude<PollStatus, 'DRAFT'>) {
    setError(null);
    setNotice(null);
    setBusyPollId(poll.id);
    try {
      const updatedPoll = await updatePollStatus(accessToken, poll.id, status);
      setPolls((currentPolls) =>
        currentPolls.map((currentPoll) =>
          currentPoll.id === updatedPoll.id ? updatedPoll : currentPoll,
        ),
      );
    } catch (requestError) {
      if (isSessionExpired(requestError)) {
        onSessionExpired();
      } else {
        setError(getErrorMessage(requestError, 'Unable to update the poll.'));
      }
    } finally {
      setBusyPollId(null);
    }
  }

  function updateOption(index: number, value: string) {
    setOptions((currentOptions) =>
      currentOptions.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    );
  }

  return (
    <section className="poll-manager" aria-labelledby="poll-manager-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">LIVE POLL / 04</p>
          <h2 id="poll-manager-title">POLL CONTROL.</h2>
        </div>
        <span className="data-label">ONE ACTIVE PER EVENT</span>
      </div>

      {eventStatus !== 'ACTIVE' && (
        <p className="notice">
          ACTIVATE THE EVENT BEFORE ACTIVATING A POLL OR ACCEPTING VOTES.
        </p>
      )}
      {error && <p className="message message--error" role="alert">{error}</p>}
      {notice && <p className="message message--success" role="status">{notice}</p>}

      <form className="panel poll-create-form" onSubmit={handleCreate}>
        <label className="field">
          <span>POLL QUESTION</span>
          <input
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
        </label>
        <div className="poll-option-fields">
          {options.map((option, index) => (
            <label className="field" key={index}>
              <span>OPTION {index + 1}</span>
              <input
                maxLength={200}
                onChange={(event) => updateOption(index, event.target.value)}
                required
                value={option}
              />
            </label>
          ))}
        </div>
        <div className="poll-form-actions">
          {options.length < 6 && (
            <button
              className="button button--secondary"
              onClick={() => setOptions((current) => [...current, ''])}
              type="button"
            >
              ADD OPTION
            </button>
          )}
          {options.length > 2 && (
            <button
              className="text-button"
              onClick={() => setOptions((current) => current.slice(0, -1))}
              type="button"
            >
              REMOVE LAST
            </button>
          )}
          <button className="button button--primary" disabled={isCreating}>
            {isCreating ? 'CREATING…' : 'CREATE POLL'}
          </button>
        </div>
      </form>

      <div className="poll-list" aria-live="polite">
        {isLoading && <p className="empty-state" role="status">LOADING POLLS…</p>}
        {!isLoading && polls.length === 0 && (
          <p className="empty-state">NO POLLS YET.</p>
        )}
        {polls.map((poll) => (
          <article className="poll-card" key={poll.id}>
            <div className="poll-card-heading">
              <h3>{poll.title}</h3>
              <span className={`status-badge status--${poll.status.toLowerCase()}`}>
                <span className="status-dot" aria-hidden="true" />
                {poll.status}
              </span>
            </div>
            <p className="data-label">
              TOTAL VOTES <strong>{poll.totalVotes}</strong>
            </p>
            <div className="poll-results">
              {poll.options.map((option) => (
                <div className="poll-result" key={option.id}>
                  <div className="poll-result-heading">
                    <span>{option.text}</span>
                    <span className="poll-result-count">
                      {option.votes} / {option.percentage}%
                    </span>
                  </div>
                  <div
                    className="poll-track"
                    role="progressbar"
                    aria-label={`${option.text} votes`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={option.percentage}
                  >
                    <span
                      className="poll-fill"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {poll.status === 'DRAFT' && (
              <button
                className="button button--primary button--small"
                disabled={eventStatus !== 'ACTIVE' || busyPollId === poll.id}
                onClick={() => void handleStatusChange(poll, 'ACTIVE')}
                type="button"
              >
                ACTIVATE POLL
              </button>
            )}
            {poll.status === 'ACTIVE' && (
              <button
                className="button button--secondary button--small"
                disabled={busyPollId === poll.id}
                onClick={() => void handleStatusChange(poll, 'CLOSED')}
                type="button"
              >
                CLOSE POLL
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
