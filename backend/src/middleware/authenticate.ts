import type { Request, RequestHandler } from 'express';
import { ApiError } from '../lib/api-error.js';
import { verifyAccessToken } from '../modules/auth/token.js';
import type { AuthenticatedUser } from '../modules/auth/types.js';

export function createAuthenticate(
  tokenSecret: Uint8Array,
): RequestHandler {
  return async (request, _response, next) => {
    const authorization = request.get('authorization');
    const match = authorization?.match(/^Bearer ([^\s]+)$/);

    if (!match) {
      next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required.'));
      return;
    }

    try {
      const verifiedToken = await verifyAccessToken(match[1], tokenSecret);
      const user: AuthenticatedUser = {
        id: verifiedToken.id,
        username: verifiedToken.username,
      };
      request.user = user;
      next();
    } catch {
      next(new ApiError(401, 'UNAUTHENTICATED', 'The access token is invalid or expired.'));
    }
  };
}

export function getAuthenticatedUser(request: Request): AuthenticatedUser {
  if (!request.user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required.');
  }

  return request.user;
}
