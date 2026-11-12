import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const tokenSecret = new TextEncoder().encode(
  'test-only-jwt-secret-not-for-application-use',
);

describe('public API rate limits', () => {
  it('returns the standard 429 response for repeated authentication attempts', async () => {
    const app = createApp({
      tokenSecret,
      rateLimitOverrides: { authentication: 1 },
    });

    const invalidLogin = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '198.51.100.10')
      .send({});
    expect(invalidLogin.status).toBe(400);

    const limited = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '203.0.113.20')
      .send({ username: 'creator', password: 'a-secure-password' });

    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Try again later.',
      },
    });
    expect(limited.headers['retry-after']).toBeDefined();
  });

  it('limits question submissions and poll votes independently', async () => {
    const app = createApp({
      tokenSecret,
      rateLimitOverrides: {
        questionSubmission: 1,
        pollVote: 1,
      },
    });

    const questionPath = `/api/public/events/${'a'.repeat(32)}/questions`;
    expect((await request(app).post(questionPath).send({})).status).toBe(400);
    expect((await request(app).post(questionPath).send({})).status).toBe(429);

    const pollId = 'c0c6a9ec-a6c6-4e50-8ff0-9f43f9270245';
    expect((await request(app).post(`/api/polls/${pollId}/votes`).send({})).status).toBe(400);
    const limitedVote = await request(app)
      .post(`/api/polls/${pollId}/votes`)
      .send({});
    expect(limitedVote.status).toBe(429);
    expect(limitedVote.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
