import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { withTransaction } from '../../database/transaction.js';
import { ApiError } from '../../lib/api-error.js';

type PollStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
type Queryable = Pool | PoolClient;

interface PollOptionRow extends QueryResultRow {
  id: string;
  poll_id: string;
  title: string;
  status: PollStatus;
  poll_created_at: Date;
  poll_updated_at: Date;
  option_id: string;
  option_text: string;
  position: number;
  vote_count: number;
}

export interface PollOptionResponse {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface PollResponse {
  id: string;
  title: string;
  status: PollStatus;
  options: PollOptionResponse[];
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const pollResultsQuery = `
  SELECT p.id, p.title, p.status,
         p.created_at AS poll_created_at,
         p.updated_at AS poll_updated_at,
         o.id AS option_id, o.option_text, o.position,
         COUNT(v.id)::INTEGER AS vote_count
  FROM polls p
  JOIN poll_options o ON o.poll_id = p.id
  LEFT JOIN votes v ON v.poll_id = p.id AND v.option_id = o.id
`;

function toPollResponses(rows: PollOptionRow[]): PollResponse[] {
  const polls = new Map<string, PollResponse>();

  for (const row of rows) {
    let poll = polls.get(row.id);
    if (!poll) {
      poll = {
        id: row.id,
        title: row.title,
        status: row.status,
        options: [],
        totalVotes: 0,
        createdAt: row.poll_created_at,
        updatedAt: row.poll_updated_at,
      };
      polls.set(row.id, poll);
    }

    const votes = Number(row.vote_count);
    poll.totalVotes += votes;
    poll.options.push({
      id: row.option_id,
      text: row.option_text,
      votes,
      percentage: 0,
    });
  }

  for (const poll of polls.values()) {
    for (const option of poll.options) {
      option.percentage = poll.totalVotes === 0
        ? 0
        : Math.round((option.votes / poll.totalVotes) * 100);
    }
  }

  return [...polls.values()];
}

async function listPolls(
  database: Queryable,
  whereClause: string,
  values: unknown[],
): Promise<PollResponse[]> {
  const result = await database.query<PollOptionRow>(
    `${pollResultsQuery}
     ${whereClause}
     GROUP BY p.id, o.id
     ORDER BY p.created_at DESC, o.position ASC`,
    values,
  );
  return toPollResponses(result.rows);
}

export async function listCreatorPolls(
  database: Pool,
  creatorId: string,
  eventId: string,
): Promise<PollResponse[]> {
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

  return listPolls(database, 'WHERE p.event_id = $1', [eventId]);
}

export async function listPublicPolls(
  database: Pool,
  publicCode: string,
): Promise<PollResponse[]> {
  const eventResult = await database.query<{ id: string }>(
    'SELECT id FROM events WHERE public_code = $1',
    [publicCode],
  );
  const event = eventResult.rows[0];

  if (!event) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
  }

  return listPolls(
    database,
    `WHERE p.event_id = $1 AND p.status IN ('ACTIVE', 'CLOSED')`,
    [event.id],
  );
}

export async function createPoll(
  database: Pool,
  creatorId: string,
  eventId: string,
  title: string,
  options: string[],
): Promise<PollResponse> {
  return withTransaction(database, async (client) => {
    const eventResult = await client.query<{
      id: string;
      creator_id: string;
    }>(
      'SELECT id, creator_id FROM events WHERE id = $1 FOR SHARE',
      [eventId],
    );
    const event = eventResult.rows[0];

    if (!event) {
      throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
    }
    if (event.creator_id !== creatorId) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this event.');
    }

    const pollResult = await client.query<{ id: string }>(
      `INSERT INTO polls (event_id, title)
       VALUES ($1, $2)
       RETURNING id`,
      [eventId, title],
    );
    const pollId = pollResult.rows[0].id;

    for (const [position, optionText] of options.entries()) {
      await client.query(
        `INSERT INTO poll_options (poll_id, option_text, position)
         VALUES ($1, $2, $3)`,
        [pollId, optionText, position],
      );
    }

    const polls = await listPolls(
      client,
      'WHERE p.id = $1',
      [pollId],
    );
    return polls[0];
  });
}

export async function updatePollStatus(
  database: Pool,
  creatorId: string,
  pollId: string,
  requestedStatus: 'ACTIVE' | 'CLOSED',
): Promise<{ eventId: string; poll: PollResponse }> {
  try {
    return await withTransaction(database, async (client) => {
      const eventResult = await client.query<{
        event_id: string;
        event_status: string;
        creator_id: string;
      }>(
        `SELECT e.id AS event_id, e.status AS event_status, e.creator_id
         FROM events e
         JOIN polls p ON p.event_id = e.id
         WHERE p.id = $1
         FOR UPDATE OF e`,
        [pollId],
      );
      const event = eventResult.rows[0];

      if (!event) {
        throw new ApiError(404, 'NOT_FOUND', 'Poll not found.');
      }
      if (event.creator_id !== creatorId) {
        throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this poll.');
      }

      const pollResult = await client.query<{ status: PollStatus }>(
        'SELECT status FROM polls WHERE id = $1 FOR UPDATE',
        [pollId],
      );
      const currentStatus = pollResult.rows[0].status;
      const transitionAllowed =
        (currentStatus === 'DRAFT' && requestedStatus === 'ACTIVE') ||
        (currentStatus === 'ACTIVE' && requestedStatus === 'CLOSED');
      if (!transitionAllowed) {
        throw new ApiError(
          409,
          'INVALID_STATUS_TRANSITION',
          'The requested poll status transition is not allowed.',
        );
      }
      if (requestedStatus === 'ACTIVE' && event.event_status !== 'ACTIVE') {
        throw new ApiError(
          409,
          'EVENT_NOT_ACTIVE',
          'The event must be active before its poll can be activated.',
        );
      }

      await client.query(
        `UPDATE polls
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [requestedStatus, pollId],
      );

      const polls = await listPolls(
        client,
        'WHERE p.id = $1',
        [pollId],
      );

      return { eventId: event.event_id, poll: polls[0] };
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505' &&
      'constraint' in error &&
      error.constraint === 'polls_one_active_per_event_idx'
    ) {
      throw new ApiError(
        409,
        'ACTIVE_POLL_EXISTS',
        'This event already has an active poll.',
      );
    }
    throw error;
  }
}

export async function submitVote(
  database: Pool,
  pollId: string,
  optionId: string,
  voterKey: string,
): Promise<{ eventId: string; poll: PollResponse }> {
  try {
    const eventId = await withTransaction(database, async (client) => {
      const eventResult = await client.query<{
        event_id: string;
        event_status: string;
      }>(
        `SELECT e.id AS event_id, e.status AS event_status
         FROM events e
         JOIN polls p ON p.event_id = e.id
         WHERE p.id = $1
         FOR SHARE OF e`,
        [pollId],
      );
      const event = eventResult.rows[0];

      if (!event) {
        throw new ApiError(404, 'NOT_FOUND', 'Poll not found.');
      }
      if (event.event_status !== 'ACTIVE') {
        throw new ApiError(409, 'POLL_NOT_ACTIVE', 'This poll is not accepting votes.');
      }

      const pollResult = await client.query<{ status: PollStatus }>(
        'SELECT status FROM polls WHERE id = $1 FOR SHARE',
        [pollId],
      );
      if (pollResult.rows[0].status !== 'ACTIVE') {
        throw new ApiError(409, 'POLL_NOT_ACTIVE', 'This poll is not accepting votes.');
      }

      const optionResult = await client.query<{ id: string }>(
        'SELECT id FROM poll_options WHERE poll_id = $1 AND id = $2',
        [pollId, optionId],
      );
      if (optionResult.rowCount !== 1) {
        throw new ApiError(400, 'INVALID_POLL_OPTION', 'Choose an option from this poll.');
      }

      await client.query(
        `INSERT INTO votes (poll_id, option_id, voter_key)
         VALUES ($1, $2, $3)`,
        [pollId, optionId, voterKey],
      );

      return event.event_id;
    });

    const polls = await listPolls(database, 'WHERE p.id = $1', [pollId]);
    return { eventId, poll: polls[0] };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505' &&
      'constraint' in error &&
      error.constraint === 'votes_poll_voter_unique'
    ) {
      throw new ApiError(
        409,
        'DUPLICATE_VOTE',
        'This browser has already voted in this poll.',
      );
    }
    throw error;
  }
}
