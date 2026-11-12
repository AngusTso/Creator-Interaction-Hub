import express from 'express';
import { pool } from './database/pool.js';
import { errorHandler } from './middleware/error-handler.js';

type DatabaseHealthCheck = () => Promise<void>;

async function checkDatabaseConnection(): Promise<void> {
  await pool.query('SELECT 1');
}

export function createApp(
  databaseHealthCheck: DatabaseHealthCheck = checkDatabaseConnection,
) {
  const app = express();

  app.use(express.json());

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

  app.use(errorHandler);

  return app;
}

export const app = createApp();
