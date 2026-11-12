import { rateLimit } from 'express-rate-limit';

export interface RateLimitOverrides {
  authentication?: number;
  questionSubmission?: number;
  pollVote?: number;
}

function createLimiter(limit: number, windowMs: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Try again later.',
        },
      });
    },
  });
}

export function createRateLimiters(overrides: RateLimitOverrides = {}) {
  return {
    authentication: createLimiter(
      overrides.authentication ?? 10,
      15 * 60 * 1000,
    ),
    questionSubmission: createLimiter(
      overrides.questionSubmission ?? 5,
      10 * 60 * 1000,
    ),
    pollVote: createLimiter(overrides.pollVote ?? 20, 10 * 60 * 1000),
  };
}
