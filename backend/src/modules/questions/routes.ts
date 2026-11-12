import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import { createAuthenticate, getAuthenticatedUser } from '../../middleware/authenticate.js';
import { ApiError } from '../../lib/api-error.js';
import { parseInput } from '../../lib/validation.js';
import {
  listModerationQuestions,
  listPublicQuestions,
  submitQuestion,
  updateQuestionStatus,
} from './service.js';

const publicCodePattern = /^[a-f0-9]{32}$/;
const questionIdSchema = z.object({ id: z.string().uuid() });
const eventIdSchema = z.object({ id: z.string().uuid() });
const statusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ANSWERED']),
}).strict();
const questionFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ANSWERED']).optional(),
});
const submitQuestionSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  content: z.string().trim().min(1).max(2000),
}).strict();

function parsePublicCode(value: string): string {
  if (!publicCodePattern.test(value)) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found.');
  }

  return value;
}

export function createQuestionsRouter(
  database: Pool,
  tokenSecret: Uint8Array,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenSecret);

  router.post('/public/events/:publicCode/questions', async (request, response) => {
    const publicCode = parsePublicCode(request.params.publicCode);
    const input = parseInput(submitQuestionSchema, request.body);
    const question = await submitQuestion(
      database,
      publicCode,
      input.displayName,
      input.content,
    );

    response.status(201).json({ success: true, data: { question } });
  });

  router.get('/public/events/:publicCode/questions', async (request, response) => {
    const publicCode = parsePublicCode(request.params.publicCode);
    const questions = await listPublicQuestions(database, publicCode);
    response.status(200).json({ success: true, data: { questions } });
  });

  router.get('/events/:id/questions', authenticate, async (request, response) => {
    const { id } = parseInput(eventIdSchema, request.params);
    const { status } = parseInput(questionFilterSchema, request.query);
    const user = getAuthenticatedUser(request);
    const questions = await listModerationQuestions(database, user.id, id, status);

    response.status(200).json({ success: true, data: { questions } });
  });

  router.patch('/questions/:id/status', authenticate, async (request, response) => {
    const { id } = parseInput(questionIdSchema, request.params);
    const { status } = parseInput(statusSchema, request.body);
    const user = getAuthenticatedUser(request);
    const question = await updateQuestionStatus(
      database,
      user.id,
      id,
      status,
    );

    response.status(200).json({ success: true, data: { question } });
  });

  return router;
}
