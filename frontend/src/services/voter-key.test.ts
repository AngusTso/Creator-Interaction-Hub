import { beforeEach, describe, expect, it } from 'vitest';
import { getVoterKey } from './voter-key';

const generatedKey = '1c2b9e57-8d35-4b9e-90e8-76b0c9d0b1f1';

describe('getVoterKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a key once and reuses it from browser storage', () => {
    const createKey = () => generatedKey;

    expect(getVoterKey(localStorage, createKey)).toBe(generatedKey);
    expect(getVoterKey(localStorage, () => {
      throw new Error('A saved key should be reused.');
    })).toBe(generatedKey);
  });

  it('replaces an invalid stored value', () => {
    localStorage.setItem('creator-interaction-hub:voter-key', 'invalid');

    expect(getVoterKey(localStorage, () => generatedKey)).toBe(generatedKey);
  });

  it('surfaces storage failures instead of silently issuing an unstable key', () => {
    const unavailableStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('Storage disabled.');
      },
    };

    expect(() => getVoterKey(unavailableStorage, () => generatedKey))
      .toThrow('This browser cannot save a vote key.');
  });
});
