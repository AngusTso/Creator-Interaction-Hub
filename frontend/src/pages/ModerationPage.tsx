import { useEffect, useState } from 'react';
import {
  ApiError,
  getErrorMessage,
  getEvent,
  listModerationQuestions,
  updateQuestionStatus,
} from '../services/api';
import type { Event, QuestionStatus, ModerationQuestion } from '../types';

interface Props {
  accessToken: string;
  eventId: string;
  onBack: () => void;
  onSessionExpired: () => void;
}

const filters: Array<{ value: QuestionStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'ALL' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'ANSWERED', label: 'ANSWERED' },
  { value: 'REJECTED', label: 'REJECTED' },
];

export default function ModerationPage({
  accessToken,
  eventId,
  onBack,
  onSessionExpired,
}: Props) {
  const [event, setEvent] = useState<Event | null>(null);
  const [questions, setQuestions] = useState<ModerationQuestion[]>([]);
  const [filter, setFilter] = useState<QuestionStatus | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyQuestionId, setBusyQuestionId] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    setIsLoading(true);
    try {
      const [loadedEvent, loadedQuestions] = await Promise.all([
        getEvent(accessToken, eventId),
        listModerationQuestions(accessToken, eventId),
      ]);
      setEvent(loadedEvent);
      setQuestions(loadedQuestions);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSessionExpired();
      } else {
        setError(getErrorMessage(requestError, 'Unable to load this event.'));
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [accessToken, eventId]);

  const visibleQuestions = filter === 'ALL'
    ? questions
    : questions.filter((question) => question.status === filter);

  async function handleStatusChange(
    question: ModerationQuestion,
    status: 'APPROVED' | 'REJECTED' | 'ANSWERED',
  ) {
    setError(null);
    setBusyQuestionId(question.id);
    try {
      const updatedQuestion = await updateQuestionStatus(
        accessToken,
        question.id,
        status,
      );
      setQuestions((currentQuestions) =>
        currentQuestions.map((currentQuestion) =>
          currentQuestion.id === updatedQuestion.id
            ? { ...currentQuestion, ...updatedQuestion }
            : currentQuestion,
        ),
      );
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSessionExpired();
      } else {
        setError(getErrorMessage(requestError, 'Unable to update the question.'));
      }
    } finally {
      setBusyQuestionId(null);
    }
  }

  return (
    <main className="content">
      <button className="back-link" onClick={onBack} type="button">
        BACK / ALL EVENTS
      </button>

      <div className="page-heading">
        <div>
          <p className="eyebrow">MODERATION / 03</p>
          <h1>{event?.title ?? 'EVENT QUESTIONS.'}</h1>
          <p className="body-copy">
            {event
              ? `EVENT STATUS / ${event.status}`
              : 'Review submitted questions and update their status.'}
          </p>
        </div>
        <button
          className="button button--secondary"
          disabled={isLoading}
          onClick={() => void loadData()}
          type="button"
        >
          {isLoading ? 'LOADING…' : 'REFRESH QUEUE'}
        </button>
      </div>

      {error && <p className="message message--error" role="alert">{error}</p>}

      <div className="filter-bar" aria-label="Filter questions" role="group">
        {filters.map((item) => {
          const count = item.value === 'ALL'
            ? questions.length
            : questions.filter((question) => question.status === item.value).length;
          return (
            <button
              aria-pressed={filter === item.value}
              className={`filter-button${filter === item.value ? ' is-selected' : ''}`}
              key={item.value}
              onClick={() => setFilter(item.value)}
              type="button"
            >
              {item.label} <span className="data-number">{count}</span>
            </button>
          );
        })}
      </div>

      {isLoading && questions.length === 0 && (
        <p className="empty-state" role="status">LOADING QUESTION QUEUE…</p>
      )}
      {!isLoading && visibleQuestions.length === 0 && (
        <p className="empty-state">
          {filter === 'ALL' ? 'THE QUEUE IS CLEAR.' : `NO ${filter} QUESTIONS.`}
        </p>
      )}

      <section className="question-list" aria-label="Questions">
        {visibleQuestions.map((question) => (
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
            {question.status === 'PENDING' && (
              <div className="question-actions">
                <button
                  aria-label={`Approve question from ${question.displayName}`}
                  className="button button--primary button--small"
                  disabled={busyQuestionId === question.id}
                  onClick={() => void handleStatusChange(question, 'APPROVED')}
                  type="button"
                >
                  APPROVE
                </button>
                <button
                  aria-label={`Reject question from ${question.displayName}`}
                  className="button button--danger button--small"
                  disabled={busyQuestionId === question.id}
                  onClick={() => void handleStatusChange(question, 'REJECTED')}
                  type="button"
                >
                  REJECT
                </button>
              </div>
            )}
            {question.status === 'APPROVED' && (
              <div className="question-actions">
                <button
                  aria-label={`Mark question from ${question.displayName} as answered`}
                  className="button button--secondary button--small"
                  disabled={busyQuestionId === question.id}
                  onClick={() => void handleStatusChange(question, 'ANSWERED')}
                  type="button"
                >
                  MARK ANSWERED
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
