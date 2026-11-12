import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import type { Pool } from 'pg';
import { ApiError } from '../../lib/api-error.js';
import type { AuthenticatedUser } from './types.js';

const unknownUserPasswordHash = bcrypt.hashSync(
  'creator-interaction-hub-unknown-user',
  12,
);

interface CreatorRow extends AuthenticatedUser {
  password_hash: string;
}

export async function authenticateCreator(
  database: Pool,
  username: string,
  password: string,
  tokenSecret: Uint8Array,
): Promise<{ user: AuthenticatedUser; accessToken: string }> {
  const result = await database.query<CreatorRow>(
    'SELECT id, username, password_hash FROM creator_users WHERE username = $1',
    [username],
  );
  const creator = result.rows[0];
  const passwordMatches = await bcrypt.compare(
    password,
    creator?.password_hash ?? unknownUserPasswordHash,
  );

  if (!creator || !passwordMatches) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid username or password.');
  }

  const user = { id: creator.id, username: creator.username };
  const accessToken = await new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(tokenSecret);

  return { user, accessToken };
}
