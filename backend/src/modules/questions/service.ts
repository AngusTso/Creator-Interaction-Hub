import type { Pool } from 'pg';
import { ApiError } from '../../lib/api-error.js';
import { withTransaction } from '../../database/transaction.js';

const QUESTION_RESULT_LIMIT = 100;

export type QuestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ANSWERED';

interface QuestionRow {
  id: string;
  event_id: string;
  display_name: string;
  content: string;
  status: QuestionStatus;
  created_at: Date;
  updated_at: Date;
}

interface PublicQuestionRow extends Omit<QuestionRow, 'status'> {
  status: 'APPROVED' | 'ANSWERED';
}

export interface PublicQuestion {
  id: string;
  displayName: string;
  content: string;
  status: 'APPROVED' | 'ANSWERED';
  createdAt: Date;
}

export interface ModerationQuestion {
  id: string;
  displayName: string;
  content: string;
  status: QuestionStatus;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmittedQuestion {
  eventId: string;
  question: Omit<PublicQuestion, 'status'> & { status: 'PENDING' };
}

function toPublicQuestion(question: PublicQuestionRow): PublicQuestion {
  return {
    id: question.id,
    displayName: question.display_name,
    content: question.content,
    status: question.status,
    createdAt: question.created_at,
  };
}

function toModerationQuestion(question: QuestionRow): ModerationQuestion {
  return {
    id: question.id,
    displayName: question.display_name,
    content: question.content,
    status: question.status,
    eventId: question.event_id,
    createdAt: question.created_at,
    updatedAt: question.updated_at,
  };
}

export async function submitQuestion(
  database: Pool,
  publicCode: string,
  displayName: string,
  content: string,
): Promise<SubmittedQuestion> {
  return withTransaction(database, async (client) => {
    const eventResult = await client.query<{ id: string; status: string }>(
      'SELECT id, status FROM events WHERE public_code = $1 FOR SHARE',
      [publicCode],
    );
    const event = eventResult.rows[0];

    if (!event) {
      throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
    }
    if (event.status !== 'ACTIVE') {
      throw new ApiError(409, 'EVENT_NOT_ACTIVE', 'This event is not accepting questions.');
    }

    const result = await client.query<QuestionRow>(
      `INSERT INTO questions (event_id, display_name, content)
       VALUES ($1, $2, $3)
       RETURNING id, event_id, display_name, content, status, created_at, updated_at`,
      [event.id, displayName, content],
    );
    const question = result.rows[0];

    return {
      eventId: event.id,
      question: {
        id: question.id,
        displayName: question.display_name,
        content: question.content,
        status: 'PENDING',
        createdAt: question.created_at,
      },
    };
  });
}

export async function listPublicQuestions(
  database: Pool,
  publicCode: string,
): Promise<PublicQuestion[]> {
  const eventResult = await database.query<{ id: string }>(
    'SELECT id FROM events WHERE public_code = $1',
    [publicCode],
  );
  const event = eventResult.rows[0];

  if (!event) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
  }

  const result = await database.query<PublicQuestionRow>(
    `SELECT id, event_id, display_name, content, status, created_at, updated_at
     FROM questions
     WHERE event_id = $1 AND status IN ('APPROVED', 'ANSWERED')
     ORDER BY created_at ASC
     LIMIT $2`,
    [event.id, QUESTION_RESULT_LIMIT],
  );

  return result.rows.map(toPublicQuestion);
}

export async function listModerationQuestions(
  database: Pool,
  creatorId: string,
  eventId: string,
  status?: QuestionStatus,
): Promise<ModerationQuestion[]> {
  const eventResult = await database.query<{ id: string; creator_id: string }>(
    'SELECT id, creator_id FROM events WHERE id = $1',
    [eventId],
  );
  const event = eventResult.rows[0];

  if (!event) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
  }
  if (event.creator_id !== creatorId) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this event.');
  }

  const result = await database.query<QuestionRow>(
    `SELECT id, event_id, display_name, content, status, created_at, updated_at
     FROM questions
     WHERE event_id = $1 AND ($2::VARCHAR IS NULL OR status = $2)
     ORDER BY created_at ASC
     LIMIT $3`,
    [eventId, status ?? null, QUESTION_RESULT_LIMIT],
  );

  return result.rows.map(toModerationQuestion);
}

export async function updateQuestionStatus(
  database: Pool,
  creatorId: string,
  questionId: string,
  requestedStatus: QuestionStatus,
): Promise<{
  id: string;
  status: QuestionStatus;
  eventId: string;
  updatedAt: Date;
}> {
  return withTransaction(database, async (client) => {
    const currentResult = await client.query<{
      id: string;
      status: QuestionStatus;
      creator_id: string;
      event_id: string;
    }>(
      `SELECT q.id, q.status, q.event_id, e.creator_id
       FROM questions q
       JOIN events e ON e.id = q.event_id
       WHERE q.id = $1
       FOR UPDATE OF q`,
      [questionId],
    );
    const current = currentResult.rows[0];

    if (!current) {
      throw new ApiError(404, 'NOT_FOUND', 'Question not found.');
    }
    if (current.creator_id !== creatorId) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this question.');
    }

    const transitionAllowed =
      (current.status === 'PENDING' &&
        (requestedStatus === 'APPROVED' || requestedStatus === 'REJECTED')) ||
      (current.status === 'APPROVED' && requestedStatus === 'ANSWERED');

    if (!transitionAllowed) {
      throw new ApiError(
        409,
        'INVALID_STATUS_TRANSITION',
        'The requested question status transition is not allowed.',
      );
    }

    const updatedResult = await client.query<{
      id: string;
      status: QuestionStatus;
      updated_at: Date;
    }>(
      `UPDATE questions
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [requestedStatus, questionId],
    );
    const updated = updatedResult.rows[0];

    return {
      id: updated.id,
      status: updated.status,
      eventId: current.event_id,
      updatedAt: updated.updated_at,
    };
  });
}
