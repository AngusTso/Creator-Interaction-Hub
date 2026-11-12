const storageKey = 'creator-interaction-hub:voter-key';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getVoterKey(
  storage: Pick<Storage, 'getItem' | 'setItem'> = window.localStorage,
  createKey: () => string = () => crypto.randomUUID(),
): string {
  let savedKey: string | null;
  try {
    savedKey = storage.getItem(storageKey);
  } catch {
    throw new Error('This browser cannot save a vote key. Check browser storage settings.');
  }

  if (savedKey && uuidPattern.test(savedKey)) {
    return savedKey;
  }

  const voterKey = createKey();
  if (!uuidPattern.test(voterKey)) {
    throw new Error('Unable to create a valid browser vote key.');
  }

  try {
    storage.setItem(storageKey, voterKey);
  } catch {
    throw new Error('This browser cannot save a vote key. Check browser storage settings.');
  }

  return voterKey;
}
