import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

describe('GET /api/health', () => {
  it('reports a healthy API and database connection', async () => {
    const databaseHealthCheck = vi.fn().mockResolvedValue(undefined);
    const response = await request(createApp(databaseHealthCheck)).get('/api/health');

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

    const response = await request(createApp(databaseHealthCheck)).get('/api/health');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    });

    logError.mockRestore();
  });
});
