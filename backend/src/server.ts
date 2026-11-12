import { EventEmitter } from 'node:events';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { getJwtSecret, getTrustProxyHops, port } from './config/env.js';
import { pool } from './database/pool.js';
import { createRealtimeServer } from './realtime/server.js';

const tokenSecret = getJwtSecret();
const questionEvents = new EventEmitter();
const app = createApp({
  database: pool,
  tokenSecret,
  trustProxyHops: getTrustProxyHops(),
  notifyQuestionSubmitted: (eventId) => {
    questionEvents.emit('question:submitted', eventId);
  },
  notifyQuestionStatusChanged: (eventId) => {
    questionEvents.emit('question:status', eventId);
  },
  notifyEventUpdated: (eventId) => {
    questionEvents.emit('event:updated', eventId);
  },
  notifyPollUpdated: (eventId) => {
    questionEvents.emit('poll:updated', eventId);
  },
});
const httpServer = createServer(app);
const realtime = createRealtimeServer(
  httpServer,
  tokenSecret,
  async (creatorId, eventId) => {
    const result = await pool.query(
      'SELECT 1 FROM events WHERE id = $1 AND creator_id = $2',
      [eventId, creatorId],
    );
    return result.rowCount === 1;
  },
  async (publicCode) => {
    const result = await pool.query<{ id: string }>(
      'SELECT id FROM events WHERE public_code = $1',
      [publicCode],
    );
    return result.rows[0]?.id ?? null;
  },
);
questionEvents.on('question:submitted', realtime.notifyQuestionSubmitted);
questionEvents.on('question:status', realtime.notifyQuestionStatusChanged);
questionEvents.on('event:updated', realtime.notifyEventUpdated);
questionEvents.on('poll:updated', realtime.notifyPollUpdated);

async function startServer(): Promise<void> {
  await pool.query('SELECT 1');

  httpServer.listen(port, () => {
    console.log(`Backend listening on port ${port}.`);
  });
}

startServer().catch(async (error: unknown) => {
  console.error('Backend failed to start. Check the PostgreSQL connection.', error);
  await pool.end();
  process.exitCode = 1;
});
