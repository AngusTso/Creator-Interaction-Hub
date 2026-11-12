import { pool } from './pool.js';
import { runMigrations } from './migrations.js';

async function main(): Promise<void> {
  try {
    await runMigrations(pool);
    console.log('Database migrations are up to date.');
  } catch (error) {
    console.error('Database migrations failed.', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();
