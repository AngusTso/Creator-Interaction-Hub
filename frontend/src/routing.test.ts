import { describe, expect, it } from 'vitest';
import { getRoute } from './routing';

describe('getRoute', () => {
  it('resolves the home, login, and creator routes', () => {
    expect(getRoute('')).toEqual({ page: 'home' });
    expect(getRoute('#/login')).toEqual({ page: 'login' });
    expect(getRoute('#/creator')).toEqual({ page: 'events' });
  });

  it('extracts event identifiers from moderation routes', () => {
    expect(getRoute('#/creator/events/event-123')).toEqual({
      page: 'moderation',
      eventId: 'event-123',
    });
  });

  it('accepts valid public codes and rejects malformed routes', () => {
    expect(getRoute('#/public/0123456789abcdef0123456789abcdef')).toEqual({
      page: 'public',
      publicCode: '0123456789abcdef0123456789abcdef',
    });
    expect(getRoute('#/public/not-a-code')).toEqual({ page: 'not-found' });
    expect(getRoute('#/unknown')).toEqual({ page: 'not-found' });
  });
});
