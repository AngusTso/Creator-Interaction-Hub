import express from 'express';
import type { Pool } from 'pg';
import { getJwtSecret } from './config/env.js';
import { pool } from './database/pool.js';
import { ApiError } from './lib/api-error.js';
import { errorHandler } from './middleware/error-handler.js';
import { createAuthRouter } from './modules/auth/routes.js';
import { createEventsRouter } from './modules/events/routes.js';
import { createQuestionsRouter } from './modules/questions/routes.js';

interface AppDependencies {
  database?: Pool;
  tokenSecret?: Uint8Array;
  databaseHealthCheck?: () => Promise<void>;
}

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();
  const database = dependencies.database ?? pool;
  const tokenSecret = dependencies.tokenSecret ?? getJwtSecret();
  const databaseHealthCheck =
    dependencies.databaseHealthCheck ??
    (async () => {
      await database.query('SELECT 1');
    });

  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', async (_request, response) => {
    await databaseHealthCheck();
    response.status(200).json({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
      },
    });
  });

  app.use('/api/auth', createAuthRouter(database, tokenSecret));
  app.use('/api', createEventsRouter(database, tokenSecret));
  app.use('/api', createQuestionsRouter(database, tokenSecret));
  app.use((_request, _response, next) => {
    next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found.'));
  });
  app.use(errorHandler);

  return app;
}
