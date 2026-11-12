import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { withTransaction } from './transaction.js';

const migrationDirectory = fileURLToPath(
  new URL('../../migrations/', import.meta.url),
);

export async function runMigrations(database: Pool): Promise<void> {
  await database.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = (await readdir(migrationDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const appliedMigrations = await database.query<{ name: string }>(
    'SELECT name FROM schema_migrations',
  );
  const appliedNames = new Set(appliedMigrations.rows.map(({ name }) => name));

  for (const file of files) {
    if (appliedNames.has(file)) {
      continue;
    }

    const sql = await readFile(new URL(`../../migrations/${file}`, import.meta.url), 'utf8');

    await withTransaction(database, async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    });
  }
}
