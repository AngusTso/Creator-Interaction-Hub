import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

describe('GET /api/health', () => {
  it('reports a healthy API and database connection', async () => {
    const databaseHealthCheck = vi.fn().mockResolvedValue(undefined);
    const response = await request(
      createApp({
        tokenSecret: new TextEncoder().encode('test-only-jwt-secret-not-for-application-use'),
        databaseHealthCheck,
      }),
    ).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
      },
    });
    expect(databaseHealthCheck).toHaveBeenCalledOnce();
  });

  it('returns a consistent error response when the database check fails', async () => {
    const databaseHealthCheck = vi
      .fn()
      .mockRejectedValue(new Error('Database connection failed.'));
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const response = await request(
        createApp({
          tokenSecret: new TextEncoder().encode('test-only-jwt-secret-not-for-application-use'),
          databaseHealthCheck,
        }),
      ).get('/api/health');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    } finally {
      logError.mockRestore();
    }
  });
});

describe('request error responses', () => {
  it('returns a validation error for malformed JSON', async () => {
    const app = createApp({
      tokenSecret: new TextEncoder().encode('test-only-jwt-secret-not-for-application-use'),
    });
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"username":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The submitted data is invalid.',
      },
    });
  });
});
