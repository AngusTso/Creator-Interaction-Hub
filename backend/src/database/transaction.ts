import type { Pool, PoolClient } from 'pg';

export async function withTransaction<T>(
  database: Pool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await database.connect();

  try {
    await client.query('BEGIN');

    try {
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Database transaction rollback failed.', rollbackError);
      }

      throw error;
    }
  } finally {
    client.release();
  }
}
