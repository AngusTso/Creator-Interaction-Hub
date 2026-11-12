import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '../.env') });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (testDatabaseUrl) {
  const databaseUrl = new URL(testDatabaseUrl);
  const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));

  if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol) || !databaseName.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URL must point to a dedicated PostgreSQL database ending in _test.');
  }

  process.env.PGHOST = databaseUrl.hostname;
  process.env.PGPORT = databaseUrl.port || '5432';
  process.env.PGDATABASE = databaseName;
  process.env.PGUSER = decodeURIComponent(databaseUrl.username);
  process.env.PGPASSWORD = decodeURIComponent(databaseUrl.password);
  process.env.JWT_SECRET = 'test-only-jwt-secret-not-for-application-use';
}
