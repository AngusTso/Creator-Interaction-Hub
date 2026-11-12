import { useEffect, useState, type FormEvent } from 'react';
import { io } from 'socket.io-client';
import {
  ApiError,
  getErrorMessage,
  getPublicEvent,
  listPublicPolls,
  listPublicQuestions,
  submitQuestion,
  submitPollVote,
} from '../services/api';
import { getVoterKey } from '../services/voter-key';
import type { Poll, PublicEvent, PublicQuestion } from '../types';

interface Props {
  publicCode: string;
}

export default function PublicEventPage({ publicCode }: Props) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [content, setContent] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [votedPollIds, setVotedPollIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState('CONNECTING');

  async function refreshEvent() {
    setError(null);
    setIsLoading(true);
    try {
      const [loadedEvent, loadedQuestions, loadedPolls] = await Promise.all([
        getPublicEvent(publicCode),
        listPublicQuestions(publicCode),
        listPublicPolls(publicCode),
      ]);
      setEvent(loadedEvent);
      setQuestions(loadedQuestions);
      setPolls(loadedPolls);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load this event.'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setEvent(null);
    setQuestions([]);
    setPolls([]);
    void refreshEvent();
  }, [publicCode]);

  useEffect(() => {
    const socket = io();
    let hasConnected = false;

    socket.on('connect', () => {
      const isReconnect = hasConnected;
      hasConnected = true;
      setLiveStatus('CONNECTED');
      socket.emit('audience:join', publicCode);
      if (isReconnect) {
        void refreshEvent();
      }
    });
    socket.on('disconnect', () => setLiveStatus('RECONNECTING'));
    socket.on('connect_error', () => setLiveStatus('OFFLINE / USE REFRESH'));
    socket.on('question:status', () => void refreshEvent());
    socket.on('event:updated', () => void refreshEvent());
    socket.on('poll:updated', () => void refreshEvent());

    return () => {
      socket.disconnect();
    };
  }, [publicCode]);

  async function handleSubmit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedName = displayName.trim();
    const trimmedContent = content.trim();
    if (!trimmedName || !trimmedContent) {
      setError('Add your name and question before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitQuestion(publicCode, trimmedName, trimmedContent);
      setDisplayName('');
      setContent('');
      setNotice('QUESTION RECEIVED. It will appear here after moderation.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to submit your question.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVote(poll: Poll) {
    const optionId = selectedOptions[poll.id];
    if (!optionId || votingPollId) {
      return;
    }

    setError(null);
    setNotice(null);
    setVotingPollId(poll.id);
    try {
      const updatedPoll = await submitPollVote(
        poll.id,
        optionId,
        getVoterKey(),
      );
      setPolls((currentPolls) =>
        currentPolls.map((currentPoll) =>
          currentPoll.id === updatedPoll.id ? updatedPoll : currentPoll,
        ),
      );
      setVotedPollIds((current) => new Set(current).add(poll.id));
      setNotice('VOTE RECORDED.');
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.code === 'DUPLICATE_VOTE') {
        setVotedPollIds((current) => new Set(current).add(poll.id));
      }
      setError(getErrorMessage(requestError, 'Unable to submit your vote.'));
    } finally {
      setVotingPollId(null);
    }
  }

  if (isLoading && !event && !error) {
    return (
      <main className="public-page" aria-busy="true">
        <header className="public-header">
          <a className="brand" href="#/" aria-label="Creator Interaction Hub home">
            <span className="brand-mark" aria-hidden="true">CH</span>
            <span className="brand-name">CREATOR / INTERACTION HUB</span>
          </a>
          <span className="data-label">LOADING EVENT</span>
        </header>
        <section className="public-intro">
          <p className="eyebrow">AUDIENCE ACCESS / 04</p>
          <h1>LOADING EVENT…</h1>
          <div className="loading-placeholder" aria-hidden="true" />
          <p className="fine-print" role="status">LOADING EVENT AND QUESTIONS</p>
        </section>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="public-page">
        <p className="eyebrow">AUDIENCE ACCESS / 04</p>
        <h1>EVENT UNAVAILABLE.</h1>
        {error && <p className="message message--error" role="alert">{error}</p>}
        <button className="button button--secondary" onClick={() => void refreshEvent()} type="button">
          TRY AGAIN
        </button>
      </main>
    );
  }

  return (
    <main className="public-page">
      <header className="public-header">
        <a className="brand" href="#/" aria-label="Creator Interaction Hub home">
          <span className="brand-mark" aria-hidden="true">CH</span>
          <span className="brand-name">CREATOR / INTERACTION HUB</span>
        </a>
        <span className={`status-badge status--${event.status.toLowerCase()}`}>
          <span className="status-dot" aria-hidden="true" />
          {event.status}
        </span>
      </header>

      <section className="public-intro">
        <p className="eyebrow">LIVE AUDIENCE Q&amp;A / {event.status}</p>
        <h1>{event.title}</h1>
        {event.description && <p className="body-copy">{event.description}</p>}
        <p className="fine-print">ASK A QUESTION. THE CREATOR WILL REVIEW IT.</p>
        <p className="fine-print" role="status">LIVE UPDATES / {liveStatus}</p>
      </section>

      {error && <p className="message message--error" role="alert">{error}</p>}
      {notice && <p className="message message--success" role="status">{notice}</p>}

      {event.status === 'ACTIVE' ? (
        <section className="panel public-form-panel" aria-labelledby="submit-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">QUESTION FORM / 01</p>
              <h2 id="submit-title">SUBMIT QUESTION.</h2>
            </div>
            <span className="data-label">NO ACCOUNT NEEDED</span>
          </div>
          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>DISPLAY NAME</span>
              <input
                autoComplete="nickname"
                maxLength={80}
                onChange={(inputEvent) => setDisplayName(inputEvent.target.value)}
                required
                value={displayName}
              />
            </label>
            <label className="field">
              <span>QUESTION</span>
              <textarea
                maxLength={2000}
                onChange={(inputEvent) => setContent(inputEvent.target.value)}
                required
                rows={4}
                value={content}
              />
            </label>
            <div className="form-footer">
              <span className="field-note">{content.length} / 2000</span>
              <button className="button button--primary" disabled={isSubmitting}>
                {isSubmitting ? 'SENDING…' : 'SUBMIT QUESTION'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <p className="notice">
          {event.status === 'DRAFT'
            ? 'THIS EVENT HAS NOT STARTED. QUESTIONS ARE CLOSED.'
            : 'THIS EVENT HAS ENDED. QUESTIONS ARE CLOSED.'}
        </p>
      )}

      <section className="public-questions" aria-labelledby="public-questions-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PUBLIC QUESTIONS / 02</p>
            <h2 id="public-questions-title">APPROVED QUESTIONS.</h2>
          </div>
          <button
            className="button button--secondary"
            disabled={isLoading}
            onClick={() => void refreshEvent()}
            type="button"
          >
            {isLoading ? 'LOADING…' : 'REFRESH'}
          </button>
        </div>

        {isLoading && questions.length === 0 && (
          <p className="empty-state" role="status">LOADING QUESTIONS…</p>
        )}
        {!isLoading && questions.length === 0 && (
          <p className="empty-state">NO APPROVED QUESTIONS YET.</p>
        )}
        <div className="question-list">
          {questions.map((question) => (
            <article className="question-row" key={question.id}>
              <div className="question-meta">
                <span className={`status-badge status--${question.status.toLowerCase()}`}>
                  <span className="status-dot" aria-hidden="true" />
                  {question.status}
                </span>
                <span className="question-author">{question.displayName}</span>
                <time className="question-time" dateTime={question.createdAt}>
                  {new Date(question.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="question-content">{question.content}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-polls" aria-labelledby="public-polls-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LIVE POLL / 03</p>
            <h2 id="public-polls-title">POLL RESULTS.</h2>
          </div>
        </div>
        {isLoading && polls.length === 0 && (
          <p className="empty-state" role="status">LOADING POLLS…</p>
        )}
        {!isLoading && polls.length === 0 && (
          <p className="empty-state">NO PUBLIC POLLS YET.</p>
        )}
        <div className="poll-list">
          {polls.map((poll) => {
            const hasVoted = votedPollIds.has(poll.id);
            const canVote = poll.status === 'ACTIVE' && event.status === 'ACTIVE';

            return (
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
                {canVote && !hasVoted && (
                  <fieldset className="poll-vote-options">
                    <legend>CHOOSE ONE OPTION</legend>
                    {poll.options.map((option) => (
                      <label className="poll-vote-option" key={option.id}>
                        <input
                          checked={selectedOptions[poll.id] === option.id}
                          name={`poll-${poll.id}`}
                          onChange={() =>
                            setSelectedOptions((current) => ({
                              ...current,
                              [poll.id]: option.id,
                            }))
                          }
                          type="radio"
                          value={option.id}
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                    <button
                      className="button button--primary button--small"
                      disabled={!selectedOptions[poll.id] || votingPollId === poll.id}
                      onClick={() => void handleVote(poll)}
                      type="button"
                    >
                      {votingPollId === poll.id ? 'SENDING…' : 'SUBMIT VOTE'}
                    </button>
                  </fieldset>
                )}
                {hasVoted && (
                  <p className="notice" role="status">YOUR VOTE IS RECORDED.</p>
                )}
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
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
