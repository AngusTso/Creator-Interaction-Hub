import { Router } from 'express';
import { z } from 'zod';
import { parseInput } from '../../lib/validation.js';
import type { Pool } from 'pg';
import { authenticateCreator } from './service.js';

const loginSchema = z.object({
  username: z.string().trim().min(1).max(100).transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(1)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
}).strict();

export function createAuthRouter(database: Pool, tokenSecret: Uint8Array): Router {
  const router = Router();

  router.post('/login', async (request, response) => {
    const input = parseInput(loginSchema, request.body);
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
