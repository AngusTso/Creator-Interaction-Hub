import bcrypt from 'bcryptjs';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createApp } from '../src/app.js';
import { pool } from '../src/database/pool.js';
import { runMigrations } from '../src/database/migrations.js';

const testDatabaseConfigured = Boolean(process.env.TEST_DATABASE_URL);
const testTokenSecret = new TextEncoder().encode(
  'test-only-jwt-secret-not-for-application-use',
);
const questionNotifier = vi.fn();
const questionStatusNotifier = vi.fn();
const eventNotifier = vi.fn();
const pollNotifier = vi.fn();
const app = createApp({
  database: pool,
  tokenSecret: testTokenSecret,
  notifyQuestionSubmitted: questionNotifier,
  notifyQuestionStatusChanged: questionStatusNotifier,
  notifyEventUpdated: eventNotifier,
  notifyPollUpdated: pollNotifier,
  rateLimitOverrides: {
    authentication: 100,
    questionSubmission: 100,
    pollVote: 100,
  },
});
const ownerPassword = 'owner-test-password';
const otherPassword = 'other-test-password';

interface CreatedEvent {
  id: string;
  publicCode: string;
  status: string;
}

async function login(username: string, password: string): Promise<string> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  expect(response.status).toBe(200);
  return response.body.data.accessToken as string;
}

async function createEvent(token: string): Promise<CreatedEvent> {
  const response = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Community Q&A' });

  expect(response.status).toBe(201);
  return response.body.data as CreatedEvent;
}

describe.skipIf(!testDatabaseConfigured)('Milestone 2 API', () => {
  beforeAll(async () => {
    await runMigrations(pool);
    await pool.query('TRUNCATE questions, events, creator_users CASCADE');

    const ownerHash = await bcrypt.hash(ownerPassword, 4);
    const otherHash = await bcrypt.hash(otherPassword, 4);
    await pool.query(
      `INSERT INTO creator_users (username, password_hash)
       VALUES ('owner', $1), ('other', $2)`,
      [ownerHash, otherHash],
    );
  });

  beforeEach(async () => {
    questionNotifier.mockClear();
    questionStatusNotifier.mockClear();
    eventNotifier.mockClear();
    pollNotifier.mockClear();
    await pool.query('TRUNCATE questions, events CASCADE');
  });

  afterAll(async () => {
    await pool.query('TRUNCATE questions, events, creator_users CASCADE');
    await pool.end();
  });

  it('authenticates creators and rejects missing or invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'owner', password: ownerPassword });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual({
      id: expect.any(String),
      username: 'owner',
    });
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.tokenType).toBe('Bearer');
    expect(response.body.data.expiresIn).toBe(900);
    expect(response.body.data.user.password_hash).toBeUndefined();

    const unknownUser = await request(app)
      .post('/api/auth/login')
      .send({ username: 'missing', password: ownerPassword });
    const incorrectPassword = await request(app)
      .post('/api/auth/login')
      .send({ username: 'owner', password: 'wrong-password' });

    expect(unknownUser.status).toBe(401);
    expect(unknownUser.body.error.message).toBe(incorrectPassword.body.error.message);
    expect(incorrectPassword.status).toBe(401);
  });

  it('registers a creator, signs them in, and rejects duplicate usernames', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({ username: '  NewCreator  ', password: 'a-secure-password' });

    expect(registration.status).toBe(201);
    expect(registration.body.data.user).toMatchObject({
      id: expect.any(String),
      username: 'newcreator',
    });
    expect(registration.body.data.accessToken).toEqual(expect.any(String));
    expect(registration.body.data.user.password_hash).toBeUndefined();

    const ownedEvents = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${registration.body.data.accessToken}`);
    expect(ownedEvents.status).toBe(200);
    expect(ownedEvents.body.data.events).toEqual([]);

    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ username: 'NEWCREATOR', password: 'a-secure-password' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('USERNAME_ALREADY_EXISTS');

    const weakPassword = await request(app)
      .post('/api/auth/register')
      .send({ username: 'another', password: 'short' });
    expect(weakPassword.status).toBe(400);
  });

  it('requires authentication and limits creators to their own events', async () => {
    const protectedResponse = await request(app).get('/api/events');
    expect(protectedResponse.status).toBe(401);
    const invalidTokenResponse = await request(app)
      .get('/api/events')
      .set('Authorization', 'Bearer invalid-token');
    expect(invalidTokenResponse.status).toBe(401);

    const ownerToken = await login('owner', ownerPassword);
    const otherToken = await login('other', otherPassword);
    const event = await createEvent(ownerToken);

    const ownerEvents = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ownerEvents.body.data.events).toHaveLength(1);
    expect(ownerEvents.body.data.events[0].id).toBe(event.id);

    const otherEvent = await request(app)
      .get(`/api/events/${event.id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(otherEvent.status).toBe(403);

    const otherUpdate = await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ status: 'ACTIVE' });
    expect(otherUpdate.status).toBe(403);
  });

  it('enforces event transitions and exposes public event details only', async () => {
    const token = await login('owner', ownerPassword);
    const event = await createEvent(token);

    const draftEvent = await request(app).get(`/api/public/events/${event.publicCode}`);
    expect(draftEvent.status).toBe(200);
    expect(draftEvent.body.data.event.status).toBe('DRAFT');
    expect(draftEvent.body.data.event).not.toHaveProperty('id');
    expect(draftEvent.body.data.event).not.toHaveProperty('creator_id');

    const draftToEnded = await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ENDED' });
    expect(draftToEnded.status).toBe(409);

    const activate = await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' });
    expect(activate.body.data.event.status).toBe('ACTIVE');
    expect(eventNotifier).toHaveBeenCalledWith(event.id);

    const end = await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ENDED' });
    expect(end.body.data.event.status).toBe('ENDED');

    const reactivate = await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' });
    expect(reactivate.status).toBe(409);

    const invalidCode = await request(app).get('/api/public/events/not-a-code');
    expect(invalidCode.status).toBe(404);
  });

  it('accepts questions only for active events and validates submissions', async () => {
    const token = await login('owner', ownerPassword);
    const event = await createEvent(token);
    const inactiveSubmission = await request(app)
      .post(`/api/public/events/${event.publicCode}/questions`)
      .send({ displayName: 'Audience', content: 'A question' });
    expect(inactiveSubmission.status).toBe(409);
    expect(inactiveSubmission.body.error.code).toBe('EVENT_NOT_ACTIVE');
    expect(questionNotifier).not.toHaveBeenCalled();

    await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' });

    const invalidSubmission = await request(app)
      .post(`/api/public/events/${event.publicCode}/questions`)
      .send({ displayName: ' ', content: '' });
    expect(invalidSubmission.status).toBe(400);
    expect(questionNotifier).not.toHaveBeenCalled();

    const submission = await request(app)
      .post(`/api/public/events/${event.publicCode}/questions`)
      .send({ displayName: ' Audience ', content: ' What inspired you? ' });
    expect(submission.status).toBe(201);
    expect(submission.body.data.question).toMatchObject({
      displayName: 'Audience',
      content: 'What inspired you?',
      status: 'PENDING',
    });
    expect(questionNotifier).toHaveBeenCalledOnce();
    expect(questionNotifier).toHaveBeenCalledWith(event.id);
  });

  it('restricts moderation and publicly returns only approved or answered questions', async () => {
    const ownerToken = await login('owner', ownerPassword);
    const otherToken = await login('other', otherPassword);
    const event = await createEvent(ownerToken);
    await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'ACTIVE' });

    const pending = await request(app)
      .post(`/api/public/events/${event.publicCode}/questions`)
      .send({ displayName: 'One', content: 'First question' });
    const rejected = await request(app)
      .post(`/api/public/events/${event.publicCode}/questions`)
      .send({ displayName: 'Two', content: 'Second question' });

    const publicPending = await request(app)
      .get(`/api/public/events/${event.publicCode}/questions`);
    expect(publicPending.body.data.questions).toEqual([]);

    const unauthenticated = await request(app)
      .get(`/api/events/${event.id}/questions`);
    expect(unauthenticated.status).toBe(401);

    const otherCreatorQuestions = await request(app)
      .get(`/api/events/${event.id}/questions`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(otherCreatorQuestions.status).toBe(403);

    const approve = await request(app)
      .patch(`/api/questions/${pending.body.data.question.id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'APPROVED' });
    expect(approve.body.data.question.status).toBe('APPROVED');
    expect(questionStatusNotifier).toHaveBeenCalledWith(event.id);

    const otherCreatorModeration = await request(app)
      .patch(`/api/questions/${pending.body.data.question.id}/status`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ status: 'ANSWERED' });
    expect(otherCreatorModeration.status).toBe(403);

    const publicApproved = await request(app)
      .get(`/api/public/events/${event.publicCode}/questions`);
    expect(publicApproved.body.data.questions).toHaveLength(1);
    expect(publicApproved.body.data.questions[0].status).toBe('APPROVED');

    const invalidTransition = await request(app)
      .patch(`/api/questions/${pending.body.data.question.id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'REJECTED' });
    expect(invalidTransition.status).toBe(409);
    expect(invalidTransition.body.error.code).toBe('INVALID_STATUS_TRANSITION');

    const reject = await request(app)
      .patch(`/api/questions/${rejected.body.data.question.id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'REJECTED' });
    expect(reject.body.data.question.status).toBe('REJECTED');

    const answer = await request(app)
      .patch(`/api/questions/${pending.body.data.question.id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'ANSWERED' });
    expect(answer.body.data.question.status).toBe('ANSWERED');

    const publicQuestions = await request(app)
      .get(`/api/public/events/${event.publicCode}/questions`);
    expect(publicQuestions.body.data.questions).toHaveLength(1);
    expect(publicQuestions.body.data.questions[0].status).toBe('ANSWERED');
    expect(publicQuestions.body.data.questions[0]).not.toHaveProperty('event_id');

    const moderatedQuestions = await request(app)
      .get(`/api/events/${event.id}/questions?status=REJECTED`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(moderatedQuestions.body.data.questions).toHaveLength(1);
    expect(moderatedQuestions.body.data.questions[0].status).toBe('REJECTED');
  });

  it('manages public polls and enforces voting and lifecycle rules', async () => {
    const ownerToken = await login('owner', ownerPassword);
    const otherToken = await login('other', otherPassword);
    const event = await createEvent(ownerToken);

    const draftActivation = await request(app)
      .post(`/api/events/${event.id}/polls`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Choose a topic', options: ['Build', 'Design'] });
    expect(draftActivation.status).toBe(201);
    const draftPoll = draftActivation.body.data.poll;

    const publicDrafts = await request(app)
      .get(`/api/public/events/${event.publicCode}/polls`);
    expect(publicDrafts.body.data.polls).toEqual([]);

    const activateBeforeEvent = await request(app)
      .patch(`/api/polls/${draftPoll.id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'ACTIVE' });
    expect(activateBeforeEvent.status).toBe(409);
    expect(activateBeforeEvent.body.error.code).toBe('EVENT_NOT_ACTIVE');

    await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'ACTIVE' });

    const duplicateOptions = await request(app)
      .post(`/api/events/${event.id}/polls`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Duplicate choices', options: ['Yes', ' yes '] });
    expect(duplicateOptions.status).toBe(400);

    const secondPollResponse = await request(app)
      .post(`/api/events/${event.id}/polls`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Second poll', options: ['One', 'Two'] });
    expect(secondPollResponse.status).toBe(201);
    const secondPoll = secondPollResponse.body.data.poll;
    const creatorPolls = await request(app)
      .get(`/api/events/${event.id}/polls`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(creatorPolls.body.data.polls).toHaveLength(2);
    const otherCreatorPolls = await request(app)
      .get(`/api/events/${event.id}/polls`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(otherCreatorPolls.status).toBe(403);

    const otherCreator = await request(app)
      .patch(`/api/polls/${draftPoll.id}/status`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ status: 'ACTIVE' });
    expect(otherCreator.status).toBe(403);

    const activate = await request(app)
      .patch(`/api/polls/${draftPoll.id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'ACTIVE' });
    expect(activate.body.data.poll.status).toBe('ACTIVE');
    expect(pollNotifier).toHaveBeenCalledWith(event.id);

    const competingActivation = await request(app)
      .patch(`/api/polls/${secondPoll.id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'ACTIVE' });
    expect(competingActivation.status).toBe(409);
    expect(competingActivation.body.error.code).toBe('ACTIVE_POLL_EXISTS');

    const optionId = draftPoll.options[0].id as string;
    const invalidOption = await request(app)
      .post(`/api/polls/${draftPoll.id}/votes`)
      .send({
        optionId: secondPoll.options[0].id,
        voterKey: '3c2b9e57-8d35-4b9e-90e8-76b0c9d0b1f1',
      });
    expect(invalidOption.status).toBe(400);

    const voterKey = '1c2b9e57-8d35-4b9e-90e8-76b0c9d0b1f1';
    const vote = await request(app)
      .post(`/api/polls/${draftPoll.id}/votes`)
      .send({ optionId, voterKey });
    expect(vote.status).toBe(200);
    expect(vote.body.data.poll.totalVotes).toBe(1);
    expect(vote.body.data.poll.options[0].votes).toBe(1);
    expect(pollNotifier).toHaveBeenLastCalledWith(event.id);

    const liveResults = await request(app)
      .get(`/api/public/events/${event.publicCode}/polls`);
    expect(liveResults.body.data.polls[0]).toMatchObject({
      status: 'ACTIVE',
      totalVotes: 1,
    });

    const duplicateVote = await request(app)
      .post(`/api/polls/${draftPoll.id}/votes`)
      .send({ optionId, voterKey });
    expect(duplicateVote.status).toBe(409);
    expect(duplicateVote.body.error.code).toBe('DUPLICATE_VOTE');

    const endEvent = await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'ENDED' });
    expect(endEvent.body.data.event.status).toBe('ENDED');

    const publicResults = await request(app)
      .get(`/api/public/events/${event.publicCode}/polls`);
    expect(publicResults.body.data.polls).toHaveLength(1);
    expect(publicResults.body.data.polls[0].status).toBe('CLOSED');
    expect(publicResults.body.data.polls[0].totalVotes).toBe(1);
    expect(JSON.stringify(publicResults.body)).not.toContain(voterKey);

    const lateVote = await request(app)
      .post(`/api/polls/${draftPoll.id}/votes`)
      .send({
        optionId: draftPoll.options[1].id,
        voterKey: '2c2b9e57-8d35-4b9e-90e8-76b0c9d0b1f1',
      });
    expect(lateVote.status).toBe(409);
    expect(lateVote.body.error.code).toBe('POLL_NOT_ACTIVE');
  });
});
