import type { Request, RequestHandler } from 'express';
import { jwtVerify } from 'jose';
import { ApiError } from '../lib/api-error.js';
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
      const { payload } = await jwtVerify(match[1], tokenSecret, {
        algorithms: ['HS256'],
      });

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.username !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          payload.sub,
        )
      ) {
        next(new ApiError(401, 'UNAUTHENTICATED', 'The access token is invalid or expired.'));
        return;
      }

      const user: AuthenticatedUser = {
        id: payload.sub,
        username: payload.username,
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
