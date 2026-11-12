import type {
  Creator,
  Event,
  EventStatus,
  ModerationQuestion,
  PublicEvent,
  PublicQuestion,
  QuestionStatus,
} from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function request<T>(
  path: string,
  options: {
    accessToken?: string;
    method?: 'GET' | 'POST' | 'PATCH';
    body?: unknown;
  } = {},
): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });
  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`);
  }
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(
      'Unable to reach the server. Check your connection and try again.',
      0,
      'NETWORK_ERROR',
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      'The server returned an invalid response.',
      response.status,
      'INVALID_RESPONSE',
    );
  }

  if (!response.ok) {
    const apiError = isRecord(payload) && isRecord(payload.error)
      ? payload.error
      : null;
    throw new ApiError(
      typeof apiError?.message === 'string'
        ? apiError.message
        : 'The request could not be completed.',
      response.status,
      typeof apiError?.code === 'string' ? apiError.code : 'REQUEST_FAILED',
    );
  }

  if (
    !isRecord(payload) ||
    payload.success !== true ||
    !('data' in payload)
  ) {
    throw new ApiError(
      'The server returned an invalid response.',
      response.status,
      'INVALID_RESPONSE',
    );
  }

  return payload.data as T;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export async function login(
  username: string,
  password: string,
): Promise<{ user: Creator; accessToken: string }> {
  const data = await request<{
    user: Creator;
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
  }>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });

  return { user: data.user, accessToken: data.accessToken };
}

export async function listEvents(accessToken: string): Promise<Event[]> {
  const data = await request<{ events: Event[] }>('/api/events', { accessToken });
  return data.events;
}

export function createEvent(
  accessToken: string,
  title: string,
  description: string,
): Promise<Event> {
  return request<Event>('/api/events', {
    accessToken,
    method: 'POST',
    body: { title, description },
  });
}

export async function getEvent(
  accessToken: string,
  eventId: string,
): Promise<Event> {
  const data = await request<{ event: Event }>(`/api/events/${eventId}`, {
    accessToken,
  });
  return data.event;
}

export async function updateEventStatus(
  accessToken: string,
  eventId: string,
  status: EventStatus,
): Promise<Event> {
  const data = await request<{ event: Event }>(
    `/api/events/${eventId}/status`,
    { accessToken, method: 'PATCH', body: { status } },
  );
  return data.event;
}

export async function getPublicEvent(publicCode: string): Promise<PublicEvent> {
  const data = await request<{ event: PublicEvent }>(
    `/api/public/events/${publicCode}`,
  );
  return data.event;
}

export async function submitQuestion(
  publicCode: string,
  displayName: string,
  content: string,
): Promise<void> {
  await request<{ question: { id: string; status: 'PENDING' } }>(
    `/api/public/events/${publicCode}/questions`,
    { method: 'POST', body: { displayName, content } },
  );
}

export async function listPublicQuestions(
  publicCode: string,
): Promise<PublicQuestion[]> {
  const data = await request<{ questions: PublicQuestion[] }>(
    `/api/public/events/${publicCode}/questions`,
  );
  return data.questions;
}

export async function listModerationQuestions(
  accessToken: string,
  eventId: string,
): Promise<ModerationQuestion[]> {
  const data = await request<{ questions: ModerationQuestion[] }>(
    `/api/events/${eventId}/questions`,
    { accessToken },
  );
  return data.questions;
}

export async function updateQuestionStatus(
  accessToken: string,
  questionId: string,
  status: QuestionStatus,
): Promise<Pick<ModerationQuestion, 'id' | 'status' | 'updatedAt'>> {
  const data = await request<{
    question: Pick<ModerationQuestion, 'id' | 'status' | 'updatedAt'>;
  }>(`/api/questions/${questionId}/status`, {
    accessToken,
    method: 'PATCH',
    body: { status },
  });
  return data.question;
}
