import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../lib/api-error.js';

function getRequestParsingError(error: unknown): ApiError | undefined {
  if (typeof error !== 'object' || error === null || !('type' in error)) {
    return undefined;
  }

  if (error.type === 'entity.parse.failed') {
    return new ApiError(400, 'VALIDATION_ERROR', 'The submitted data is invalid.');
  }
  if (error.type === 'entity.too.large') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', 'The request body is too large.');
  }

  return undefined;
}

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  const apiError =
    error instanceof ApiError ? error : getRequestParsingError(error);

  if (apiError) {
    response.status(apiError.statusCode).json({
      success: false,
      error: {
        code: apiError.code,
        message: apiError.message,
      },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
};
