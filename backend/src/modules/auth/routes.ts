import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { parseInput } from '../../lib/validation.js';
import type { Pool } from 'pg';
import {
  authenticateCreator,
  registerCreator,
} from './service.js';

const credentialsSchema = z.object({
  username: z.string().trim().min(1).max(100).transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(1)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
}).strict();
const registerSchema = credentialsSchema.extend({
  password: z
    .string()
    .min(12)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
}).strict();

export function createAuthRouter(
  database: Pool,
  tokenSecret: Uint8Array,
  authenticationLimiter: RequestHandler,
): Router {
  const router = Router();

  router.post('/register', authenticationLimiter, async (request, response) => {
    const input = parseInput(registerSchema, request.body);
    const session = await registerCreator(
      database,
      input.username,
      input.password,
      tokenSecret,
    );

    response.status(201).json({
      success: true,
      data: {
        ...session,
        tokenType: 'Bearer',
        expiresIn: 900,
      },
    });
  });

  router.post('/login', authenticationLimiter, async (request, response) => {
    const input = parseInput(credentialsSchema, request.body);
    const { user, accessToken } = await authenticateCreator(
      database,
      input.username,
      input.password,
      tokenSecret,
    );

    response.status(200).json({
      success: true,
      data: {
        user,
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 900,
      },
    });
  });

  return router;
}
