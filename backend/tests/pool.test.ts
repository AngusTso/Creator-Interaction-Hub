import { describe, expect, it, vi } from 'vitest';
import { pool } from '../src/database/pool.js';

describe('PostgreSQL pool errors', () => {
  it('logs idle-client errors instead of leaving them unhandled', () => {
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Database connection was closed.');

    try {
      pool.emit('error', error);
      expect(logError).toHaveBeenCalledWith(
        'Unexpected error on an idle PostgreSQL client.',
        error,
      );
    } finally {
      logError.mockRestore();
    }
  });
});
