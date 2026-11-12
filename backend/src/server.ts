import { app } from './app.js';
import { port } from './config/env.js';
import { pool } from './database/pool.js';

async function startServer(): Promise<void> {
  await pool.query('SELECT 1');

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}.`);
  });
}

startServer().catch(async (error: unknown) => {
  console.error('Backend failed to start. Check the PostgreSQL connection.', error);
  await pool.end();
  process.exitCode = 1;
});
