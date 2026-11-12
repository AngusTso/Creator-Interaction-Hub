import { useEffect, useState, type FormEvent } from 'react';
import CreatorHeader from '../components/CreatorHeader';
import {
  ApiError,
  createEvent,
  getErrorMessage,
  listEvents,
  updateEventStatus,
} from '../services/api';
import type { Creator, Event, EventStatus } from '../types';

interface Props {
  accessToken: string;
  creator: Creator;
  onLogout: () => void;
  onSessionExpired: () => void;
  onOpenEvent: (eventId: string) => void;
}

function publicUrl(publicCode: string): string {
  return `${window.location.origin}${window.location.pathname}#/public/${publicCode}`;
}

function statusLabel(status: EventStatus): string {
  return status.replace('_', ' ');
}

export default function EventsPage({
  accessToken,
  creator,
  onLogout,
  onSessionExpired,
  onOpenEvent,
}: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function loadEvents() {
    setError(null);
    setIsLoading(true);
    try {
      setEvents(await listEvents(accessToken));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSessionExpired();
      } else {
        setError(getErrorMessage(requestError, 'Unable to load your events.'));
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, [accessToken]);

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Enter an event title.');
      return;
    }

    setIsCreating(true);
    try {
      const createdEvent = await createEvent(
        accessToken,
        trimmedTitle,
        description.trim(),
      );
      setEvents((currentEvents) => [createdEvent, ...currentEvents]);
      setTitle('');
      setDescription('');
      setNotice('EVENT CREATED. Your public link is ready.');
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSessionExpired();
      } else {
        setError(getErrorMessage(requestError, 'Unable to create the event.'));
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStatusChange(event: Event, status: EventStatus) {
    setError(null);
    setNotice(null);
    setBusyEventId(event.id);
    try {
      const updatedEvent = await updateEventStatus(accessToken, event.id, status);
      setEvents((currentEvents) =>
        currentEvents.map((currentEvent) =>
          currentEvent.id === updatedEvent.id ? updatedEvent : currentEvent,
        ),
      );
      setNotice(`EVENT ${statusLabel(status)}.`);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSessionExpired();
      } else {
        setError(getErrorMessage(requestError, 'Unable to update the event.'));
      }
    } finally {
      setBusyEventId(null);
    }
  }

  async function handleCopyLink(publicCode: string) {
    setError(null);
    try {
      await navigator.clipboard.writeText(publicUrl(publicCode));
      setCopiedCode(publicCode);
      window.setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      setError('Copy was blocked. Select the public link and copy it manually.');
    }
  }

  return (
    <div className="app-shell">
      <CreatorHeader creator={creator} onLogout={onLogout} />
      <main className="content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">CREATOR DASHBOARD / 02</p>
            <h1>YOUR EVENTS.</h1>
            <p className="body-copy">Create and manage your Q&amp;A events.</p>
          </div>
          <p className="data-label">
            EVENTS <strong>{events.length.toString().padStart(2, '0')}</strong>
          </p>
        </div>

        {error && <p className="message message--error" role="alert">{error}</p>}
        {notice && <p className="message message--success" role="status">{notice}</p>}

        <div className="dashboard-grid">
          <section className="panel create-panel" aria-labelledby="create-title">
            <p className="eyebrow">NEW EVENT / 01</p>
            <h2 id="create-title">EVENT DETAILS.</h2>
            <form className="form-stack" onSubmit={handleCreateEvent}>
              <label className="field">
                <span>EVENT TITLE <span className="field-note">REQUIRED</span></span>
                <input
                  maxLength={200}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="COMMUNITY Q&A"
                  required
                  value={title}
                />
              </label>
              <label className="field">
                <span>DESCRIPTION <span className="field-note">OPTIONAL</span></span>
                <textarea
                  maxLength={5000}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="WHAT SHOULD THE AUDIENCE KNOW?"
                  rows={4}
                  value={description}
                />
              </label>
              <button className="button button--primary" disabled={isCreating}>
                {isCreating ? 'CREATING…' : 'CREATE EVENT'}
              </button>
            </form>
          </section>

          <section className="events-section" aria-labelledby="events-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">EVENTS / 02</p>
                <h2 id="events-title">YOUR EVENTS.</h2>
              </div>
              <button
                className="button button--secondary"
                disabled={isLoading}
                onClick={() => void loadEvents()}
                type="button"
              >
                {isLoading ? 'LOADING…' : 'REFRESH'}
              </button>
            </div>

            {isLoading && events.length === 0 && (
              <p className="empty-state" role="status">LOADING EVENTS…</p>
            )}
            {!isLoading && events.length === 0 && (
              <p className="empty-state">NO EVENTS YET. CREATE THE FIRST ONE.</p>
            )}

            <div className="event-list">
              {events.map((event) => (
                <article className="event-card" key={event.id}>
                  <div className="event-card-heading">
                    <div>
                      <p className="event-date">
                        CREATED {new Date(event.createdAt).toLocaleDateString()}
                      </p>
                      <h3>{event.title}</h3>
                    </div>
                    <span className={`status-badge status--${event.status.toLowerCase()}`}>
                      <span className="status-dot" aria-hidden="true" />
                      {statusLabel(event.status)}
                    </span>
                  </div>

                  {event.description && <p className="event-description">{event.description}</p>}

                  <div className="event-link-block">
                    <span className="field-note">PUBLIC PARTICIPATION LINK</span>
                    <a
                      className="public-link"
                      href={`#/public/${event.publicCode}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {publicUrl(event.publicCode)}
                    </a>
                    <button
                      className="text-button"
                      onClick={() => void handleCopyLink(event.publicCode)}
                      type="button"
                    >
                      {copiedCode === event.publicCode ? 'COPIED' : 'COPY LINK'}
                    </button>
                  </div>

                  <div className="event-actions">
                    <button
                      className="button button--secondary"
                      onClick={() => onOpenEvent(event.id)}
                      type="button"
                    >
                      MODERATE QUESTIONS
                    </button>
                    {event.status === 'DRAFT' && (
                      <button
                        className="button button--primary"
                        disabled={busyEventId === event.id}
                        onClick={() => void handleStatusChange(event, 'ACTIVE')}
                        type="button"
                      >
                        ACTIVATE EVENT
                      </button>
                    )}
                    {event.status === 'ACTIVE' && (
                      <button
                        className="button button--danger"
                        disabled={busyEventId === event.id}
                        onClick={() => void handleStatusChange(event, 'ENDED')}
                        type="button"
                      >
                        END EVENT
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
