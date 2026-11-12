import '../config/env.js';
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool();

pool.on('error', (error: Error) => {
  console.error('Unexpected error on an idle PostgreSQL client.', error);
});
