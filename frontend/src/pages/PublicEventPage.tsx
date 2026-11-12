import { useEffect, useState, type FormEvent } from 'react';
import {
  getErrorMessage,
  getPublicEvent,
  listPublicQuestions,
  submitQuestion,
} from '../services/api';
import type { PublicEvent, PublicQuestion } from '../types';

interface Props {
  publicCode: string;
}

export default function PublicEventPage({ publicCode }: Props) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refreshEvent() {
    setError(null);
    setIsLoading(true);
    try {
      const [loadedEvent, loadedQuestions] = await Promise.all([
        getPublicEvent(publicCode),
        listPublicQuestions(publicCode),
      ]);
      setEvent(loadedEvent);
      setQuestions(loadedQuestions);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load this event.'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshEvent();
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

  if (isLoading && !event && !error) {
    return (
      <main className="public-page">
        <p className="eyebrow">AUDIENCE ACCESS / 04</p>
        <p className="empty-state" role="status">LOADING EVENT…</p>
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
    </main>
  );
}
