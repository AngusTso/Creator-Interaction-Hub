import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

async function main(): Promise<void> {
  const username = process.env.SEED_CREATOR_USERNAME?.trim().toLowerCase();
  const password = process.env.SEED_CREATOR_PASSWORD;

  if (!username || !password) {
    throw new Error('SEED_CREATOR_USERNAME and SEED_CREATOR_PASSWORD must be set.');
  }
  if (username.length > 100 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Seed creator credentials exceed the supported length.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO creator_users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO NOTHING`,
    [username, passwordHash],
  );
  console.log(`Seed creator "${username}" is ready.`);
}

main()
  .catch((error: unknown) => {
    console.error('Demo creator seeding failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
