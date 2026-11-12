import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import { ApiError } from '../../lib/api-error.js';
import { withTransaction } from '../../database/transaction.js';

export type EventStatus = 'DRAFT' | 'ACTIVE' | 'ENDED';

interface EventRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  public_code: string;
  status: EventStatus;
  created_at: Date;
  updated_at: Date;
}

export interface EventResponse {
  id: string;
  title: string;
  description: string | null;
  publicCode: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicEventResponse {
  title: string;
  description: string | null;
  publicCode: string;
  status: EventStatus;
}

function toEventResponse(event: EventRow): EventResponse {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    publicCode: event.public_code,
    status: event.status,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  };
}

export async function createEvent(
  database: Pool,
  creatorId: string,
  title: string,
  description: string | null,
): Promise<EventResponse> {
  const publicCode = randomBytes(16).toString('hex');
  const result = await database.query<EventRow>(
    `INSERT INTO events (creator_id, title, description, public_code)
     VALUES ($1, $2, $3, $4)
     RETURNING id, creator_id, title, description, public_code, status, created_at, updated_at`,
    [creatorId, title, description, publicCode],
  );

  return toEventResponse(result.rows[0]);
}

export async function listCreatorEvents(
  database: Pool,
  creatorId: string,
): Promise<EventResponse[]> {
  const result = await database.query<EventRow>(
    `SELECT id, creator_id, title, description, public_code, status, created_at, updated_at
     FROM events
     WHERE creator_id = $1
     ORDER BY created_at DESC`,
    [creatorId],
  );

  return result.rows.map(toEventResponse);
}

export async function getCreatorEvent(
  database: Pool,
  creatorId: string,
  eventId: string,
): Promise<EventResponse> {
  const result = await database.query<EventRow>(
    `SELECT id, creator_id, title, description, public_code, status, created_at, updated_at
     FROM events
     WHERE id = $1`,
    [eventId],
  );
  const event = result.rows[0];

  if (!event) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
  }
  if (event.creator_id !== creatorId) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this event.');
  }

  return toEventResponse(event);
}

export async function getPublicEvent(
  database: Pool,
  publicCode: string,
): Promise<PublicEventResponse> {
  const result = await database.query<{
    title: string;
    description: string | null;
    public_code: string;
    status: EventStatus;
  }>(
    `SELECT title, description, public_code, status
     FROM events
     WHERE public_code = $1`,
    [publicCode],
  );
  const event = result.rows[0];

  if (!event) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
  }

  return {
    title: event.title,
    description: event.description,
    publicCode: event.public_code,
    status: event.status,
  };
}

export async function updateEventStatus(
  database: Pool,
  creatorId: string,
  eventId: string,
  requestedStatus: EventStatus,
): Promise<EventResponse> {
  return withTransaction(database, async (client) => {
    const currentResult = await client.query<Pick<EventRow, 'id' | 'creator_id' | 'status'>>(
      'SELECT id, creator_id, status FROM events WHERE id = $1 FOR UPDATE',
      [eventId],
    );
    const current = currentResult.rows[0];

    if (!current) {
      throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
    }
    if (current.creator_id !== creatorId) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this event.');
    }

    const transitionAllowed =
      (current.status === 'DRAFT' && requestedStatus === 'ACTIVE') ||
      (current.status === 'ACTIVE' && requestedStatus === 'ENDED');

    if (!transitionAllowed) {
      throw new ApiError(
        409,
        'INVALID_STATUS_TRANSITION',
        'The requested event status transition is not allowed.',
      );
    }

    const updatedResult = await client.query<EventRow>(
      `UPDATE events
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, creator_id, title, description, public_code, status, created_at, updated_at`,
      [requestedStatus, eventId],
    );

    return toEventResponse(updatedResult.rows[0]);
  });
}
