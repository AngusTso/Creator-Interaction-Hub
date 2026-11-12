import { Router, type RequestHandler } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { parseInput } from '../../lib/validation.js';
import { createAuthenticate, getAuthenticatedUser } from '../../middleware/authenticate.js';
import {
  createPoll,
  listCreatorPolls,
  listPublicPolls,
  submitVote,
  updatePollStatus,
} from './service.js';

const publicCodePattern = /^[a-f0-9]{32}$/;
const eventIdSchema = z.object({ id: z.string().uuid() });
const pollIdSchema = z.object({ id: z.string().uuid() });
const createPollSchema = z.object({
  title: z.string().trim().min(1).max(200),
  options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
}).strict().superRefine(({ options }, context) => {
  const normalizedOptions = options.map((option) => option.toLowerCase());
  if (new Set(normalizedOptions).size !== normalizedOptions.length) {
    context.addIssue({
      code: 'custom',
      path: ['options'],
      message: 'Poll options must be distinct.',
    });
  }
});
const pollStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'CLOSED']),
}).strict();
const voteSchema = z.object({
  optionId: z.string().uuid(),
  voterKey: z.string().uuid(),
}).strict();

function parsePublicCode(value: string): string {
  if (!publicCodePattern.test(value)) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
  }
  return value;
}

export function createPollsRouter(
  database: Pool,
  tokenSecret: Uint8Array,
  pollVoteLimiter: RequestHandler,
  notifyPollUpdated?: (eventId: string) => void,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenSecret);

  router.post('/events/:id/polls', authenticate, async (request, response) => {
    const { id: eventId } = parseInput(eventIdSchema, request.params);
    const input = parseInput(createPollSchema, request.body);
    const creator = getAuthenticatedUser(request);
    const poll = await createPoll(
      database,
      creator.id,
      eventId,
      input.title,
      input.options,
    );

    response.status(201).json({ success: true, data: { poll } });
  });

  router.get('/events/:id/polls', authenticate, async (request, response) => {
    const { id: eventId } = parseInput(eventIdSchema, request.params);
    const creator = getAuthenticatedUser(request);
    const polls = await listCreatorPolls(database, creator.id, eventId);
    response.status(200).json({ success: true, data: { polls } });
  });

  router.get('/public/events/:publicCode/polls', async (request, response) => {
    const publicCode = parsePublicCode(request.params.publicCode);
    const polls = await listPublicPolls(database, publicCode);
    response.status(200).json({ success: true, data: { polls } });
  });

  router.patch('/polls/:id/status', authenticate, async (request, response) => {
    const { id: pollId } = parseInput(pollIdSchema, request.params);
    const { status } = parseInput(pollStatusSchema, request.body);
    const creator = getAuthenticatedUser(request);
    const result = await updatePollStatus(
      database,
      creator.id,
      pollId,
      status,
    );
    notifyPollUpdated?.(result.eventId);

    response.status(200).json({
      success: true,
      data: { poll: result.poll },
    });
  });

  router.post(
    '/polls/:id/votes',
    pollVoteLimiter,
    async (request, response) => {
      const { id: pollId } = parseInput(pollIdSchema, request.params);
      const input = parseInput(voteSchema, request.body);
      const result = await submitVote(
        database,
        pollId,
        input.optionId,
        input.voterKey,
      );
      notifyPollUpdated?.(result.eventId);

      response.status(200).json({
        success: true,
        data: { poll: result.poll },
      });
    },
  );

  return router;
}
