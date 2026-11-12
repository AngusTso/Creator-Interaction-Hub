import { createServer } from 'node:http';
import { SignJWT } from 'jose';
import { io as connect } from 'socket.io-client';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createRealtimeServer,
  moderationRoom,
} from '../src/realtime/server.js';

const tokenSecret = new TextEncoder().encode(
  'test-only-jwt-secret-not-for-application-use',
);
const ownerId = 'c0c6a9ec-a6c6-4e50-8ff0-9f43f9270245';
const otherCreatorId = '0bf2c2bf-64fb-41d8-918c-f72ad4399a43';
const ownedEventId = '9322ea6e-943e-44be-bc2d-7b08f30d197d';
const otherEventId = 'e84657a1-c43e-4675-95fc-d10c5e155c37';

async function createToken(creatorId: string): Promise<string> {
  return new SignJWT({ username: 'test-creator' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(creatorId)
    .setIssuedAt()
    .setExpirationTime('1m')
    .sign(tokenSecret);
}

function waitForSocketEvent<T>(
  socket: ReturnType<typeof connect>,
  eventName: string,
): Promise<T> {
  return new Promise((resolve) => {
    socket.once(eventName, (payload: T) => resolve(payload));
  });
}

describe('moderator Socket.IO access', () => {
  const canModerateEvent = vi.fn(
    async (creatorId: string, eventId: string) =>
      creatorId === ownerId && eventId === ownedEventId,
  );
  const httpServer = createServer();
  const realtime = createRealtimeServer(
    httpServer,
    tokenSecret,
    canModerateEvent,
  );
  let serverUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      httpServer.listen(0, resolve);
    });

    const address = httpServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Socket.IO test server did not bind to a TCP port.');
    }

    serverUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(() => {
    canModerateEvent.mockClear();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      realtime.io.close(() => resolve());
    });
  });

  it('rejects unauthenticated socket connections', async () => {
    const socket = connect(serverUrl, {
      auth: { token: 'invalid-token' },
      reconnection: false,
      transports: ['websocket'],
    });

    try {
      const error = await waitForSocketEvent<Error>(socket, 'connect_error');
      expect(error.message).toBe('UNAUTHENTICATED');
    } finally {
      socket.disconnect();
    }
  });

  it('only joins owned event rooms and notifies joined moderators', async () => {
    const socket = connect(serverUrl, {
      auth: { token: await createToken(ownerId) },
      reconnection: false,
      transports: ['websocket'],
    });

    try {
      await waitForSocketEvent<void>(socket, 'connect');
      const joinedEvent = waitForSocketEvent<{ eventId: string }>(
        socket,
        'moderation:joined',
      );
      socket.emit('moderation:join', ownedEventId);
      const joined = await joinedEvent;
      expect(joined).toEqual({ eventId: ownedEventId });
      expect(canModerateEvent).toHaveBeenCalledWith(ownerId, ownedEventId);

      const notification = waitForSocketEvent<{ eventId: string }>(
        socket,
        'question:created',
      );
      realtime.notifyQuestionSubmitted(ownedEventId);
      const notificationPayload = await notification;
      expect(notificationPayload).toEqual({ eventId: ownedEventId });
      expect(moderationRoom(ownedEventId)).toBe(
        `event:${ownedEventId}:moderators`,
      );

      const denied = waitForSocketEvent<{ message: string }>(
        socket,
        'moderation:error',
      );
      socket.emit('moderation:join', otherEventId);
      const deniedPayload = await denied;
      expect(deniedPayload).toEqual({
        message: 'You cannot access this event.',
      });
    } finally {
      socket.disconnect();
    }
  });

  it('rejects a valid token for another creator', async () => {
    const socket = connect(serverUrl, {
      auth: { token: await createToken(otherCreatorId) },
      reconnection: false,
      transports: ['websocket'],
    });

    try {
      await waitForSocketEvent<void>(socket, 'connect');
      const denied = waitForSocketEvent<{ message: string }>(
        socket,
        'moderation:error',
      );
      socket.emit('moderation:join', ownedEventId);
      const payload = await denied;
      expect(payload).toEqual({
        message: 'You cannot access this event.',
      });
      expect(canModerateEvent).toHaveBeenLastCalledWith(
        otherCreatorId,
        ownedEventId,
      );
    } finally {
      socket.disconnect();
    }
  });
});
