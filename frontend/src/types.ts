export type EventStatus = 'DRAFT' | 'ACTIVE' | 'ENDED';
export type QuestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ANSWERED';

export interface Creator {
  id: string;
  username: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  publicCode: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PublicEvent {
  title: string;
  description: string | null;
  publicCode: string;
  status: EventStatus;
}

export interface ModerationQuestion {
  id: string;
  displayName: string;
  content: string;
  status: QuestionStatus;
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicQuestion {
  id: string;
  displayName: string;
  content: string;
  status: 'APPROVED' | 'ANSWERED';
  createdAt: string;
}
