import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import { ApiError } from '../../lib/api-error.js';
import { createAuthenticate, getAuthenticatedUser } from '../../middleware/authenticate.js';
import { parseInput } from '../../lib/validation.js';
import {
  createEvent,
  getCreatorEvent,
  getPublicEvent,
  listCreatorEvents,
  updateEventStatus,
} from './service.js';

const createEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((value) => value || null),
}).strict();

const eventIdSchema = z.object({ id: z.string().uuid() });
const eventStatusSchema = z.object({ status: z.enum(['DRAFT', 'ACTIVE', 'ENDED']) }).strict();
const publicCodePattern = /^[a-f0-9]{32}$/;

function parsePublicCode(value: string): string {
  if (!publicCodePattern.test(value)) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
  }

  return value;
}

export function createEventsRouter(
  database: Pool,
  tokenSecret: Uint8Array,
  notifyEventUpdated?: (eventId: string) => void,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenSecret);

  router.get('/public/events/:publicCode', async (request, response) => {
    const publicCode = parsePublicCode(request.params.publicCode);
    const event = await getPublicEvent(database, publicCode);
    response.status(200).json({ success: true, data: { event } });
  });

  router.post('/events', authenticate, async (request, response) => {
    const input = parseInput(createEventSchema, request.body);
    const user = getAuthenticatedUser(request);
    const event = await createEvent(database, user.id, input.title, input.description);

    response.status(201).json({ success: true, data: event });
  });

  router.get('/events', authenticate, async (request, response) => {
    const user = getAuthenticatedUser(request);
    const events = await listCreatorEvents(database, user.id);
    response.status(200).json({ success: true, data: { events } });
  });

  router.get('/events/:id', authenticate, async (request, response) => {
    const { id } = parseInput(eventIdSchema, request.params);
    const user = getAuthenticatedUser(request);
    const event = await getCreatorEvent(database, user.id, id);
    response.status(200).json({ success: true, data: { event } });
  });

  router.patch('/events/:id/status', authenticate, async (request, response) => {
    const { id } = parseInput(eventIdSchema, request.params);
    const { status } = parseInput(eventStatusSchema, request.body);
    const user = getAuthenticatedUser(request);
    const event = await updateEventStatus(
      database,
      user.id,
      id,
      status,
    );
    notifyEventUpdated?.(event.id);

    response.status(200).json({ success: true, data: { event } });
  });

  return router;
}
