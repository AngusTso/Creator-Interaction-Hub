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

async function createAccessToken(
  user: AuthenticatedUser,
  tokenSecret: Uint8Array,
): Promise<string> {
  return new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(tokenSecret);
}

export async function registerCreator(
  database: Pool,
  username: string,
  password: string,
  tokenSecret: Uint8Array,
): Promise<{ user: AuthenticatedUser; accessToken: string }> {
  const passwordHash = await bcrypt.hash(password, 12);
  let user: AuthenticatedUser;

  try {
    const result = await database.query<AuthenticatedUser>(
      `INSERT INTO creator_users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username`,
      [username, passwordHash],
    );
    user = result.rows[0];
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new ApiError(
        409,
        'USERNAME_ALREADY_EXISTS',
        'That username is already in use.',
      );
    }

    throw error;
  }

  return { user, accessToken: await createAccessToken(user, tokenSecret) };
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
  const accessToken = await createAccessToken(user, tokenSecret);

  return { user, accessToken };
}
