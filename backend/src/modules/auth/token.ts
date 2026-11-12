import { jwtVerify } from 'jose';
import type { AuthenticatedUser } from './types.js';

const creatorIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface VerifiedAccessToken extends AuthenticatedUser {
  expiresAt: number;
}

export async function verifyAccessToken(
  token: string,
  tokenSecret: Uint8Array,
): Promise<VerifiedAccessToken> {
  const { payload } = await jwtVerify(token, tokenSecret, {
    algorithms: ['HS256'],
  });

  if (
    typeof payload.sub !== 'string' ||
    !creatorIdPattern.test(payload.sub) ||
    typeof payload.username !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    throw new Error('Invalid access token claims.');
  }

  return {
    id: payload.sub,
    username: payload.username,
    expiresAt: payload.exp,
  };
}
