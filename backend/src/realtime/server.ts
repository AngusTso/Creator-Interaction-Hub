import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { z } from 'zod';
import { verifyAccessToken } from '../modules/auth/token.js';

interface ClientToServerEvents {
  'moderation:join': (eventId: string) => void;
  'audience:join': (publicCode: string) => void;
}

interface ServerToClientEvents {
  'moderation:joined': (payload: { eventId: string }) => void;
  'moderation:error': (payload: { message: string }) => void;
  'audience:joined': (payload: { publicCode: string }) => void;
  'audience:error': (payload: { message: string }) => void;
  'question:created': (payload: { eventId: string }) => void;
  'question:status': (payload: { eventId: string }) => void;
  'event:updated': (payload: { eventId: string }) => void;
  'poll:updated': (payload: { eventId: string }) => void;
}

interface InterServerEvents {}

interface SocketData {
  creatorId?: string;
  expiresAt?: number;
}

const eventIdSchema = z.string().uuid();
const publicCodeSchema = z.string().regex(/^[a-f0-9]{32}$/);

export function moderationRoom(eventId: string): string {
  return `event:${eventId}:moderators`;
}

export function audienceRoom(eventId: string): string {
  return `event:${eventId}:audience`;
}

export function createRealtimeServer(
  httpServer: HttpServer,
  tokenSecret: Uint8Array,
  canModerateEvent: (creatorId: string, eventId: string) => Promise<boolean>,
  getPublicEventId: (publicCode: string) => Promise<string | null>,
) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer);

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (typeof token !== 'string') {
      next();
      return;
    }

    try {
      const claims = await verifyAccessToken(token, tokenSecret);
      socket.data.creatorId = claims.id;
      socket.data.expiresAt = claims.expiresAt;
      next();
    } catch {
      next(new Error('UNAUTHENTICATED'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.data.expiresAt !== undefined) {
      const expirationDelay = socket.data.expiresAt * 1000 - Date.now();
      if (expirationDelay <= 0) {
        socket.disconnect(true);
        return;
      }

      const expirationTimer = setTimeout(
        () => socket.disconnect(true),
        expirationDelay,
      );
      socket.once('disconnect', () => clearTimeout(expirationTimer));
    }

    socket.on('moderation:join', async (rawEventId) => {
      const parsedEventId = eventIdSchema.safeParse(rawEventId);
      if (!parsedEventId.success || !socket.data.creatorId) {
        socket.emit('moderation:error', {
          message: 'You cannot access this event.',
        });
        return;
      }

      try {
        const eventId = parsedEventId.data;
        const allowed = await canModerateEvent(socket.data.creatorId, eventId);
        if (!allowed) {
          socket.emit('moderation:error', {
            message: 'You cannot access this event.',
          });
          return;
        }

        await socket.join(moderationRoom(eventId));
        socket.emit('moderation:joined', { eventId });
      } catch (error) {
        console.error('Unable to authorize a moderation Socket.IO room.', error);
        socket.emit('moderation:error', {
          message: 'Unable to join live updates.',
        });
      }
    });

    socket.on('audience:join', async (rawPublicCode) => {
      const parsedPublicCode = publicCodeSchema.safeParse(rawPublicCode);
      if (!parsedPublicCode.success) {
        socket.emit('audience:error', { message: 'This event is unavailable.' });
        return;
      }

      try {
        const eventId = await getPublicEventId(parsedPublicCode.data);
        if (!eventId) {
          socket.emit('audience:error', { message: 'This event is unavailable.' });
          return;
        }

        await socket.join(audienceRoom(eventId));
        socket.emit('audience:joined', { publicCode: parsedPublicCode.data });
      } catch (error) {
        console.error('Unable to authorize a public Socket.IO room.', error);
        socket.emit('audience:error', {
          message: 'Unable to join live updates.',
        });
      }
    });
  });

  return {
    io,
    notifyQuestionSubmitted(eventId: string) {
      io.to(moderationRoom(eventId)).emit('question:created', { eventId });
    },
    notifyQuestionStatusChanged(eventId: string) {
      io.to(moderationRoom(eventId)).emit('question:status', { eventId });
      io.to(audienceRoom(eventId)).emit('question:status', { eventId });
    },
    notifyEventUpdated(eventId: string) {
      io.to(audienceRoom(eventId)).emit('event:updated', { eventId });
    },
    notifyPollUpdated(eventId: string) {
      io.to(moderationRoom(eventId)).emit('poll:updated', { eventId });
      io.to(audienceRoom(eventId)).emit('poll:updated', { eventId });
    },
  };
}
