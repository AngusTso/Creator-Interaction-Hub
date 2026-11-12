# User Guide

Start the app using the [Quick Start](./submission-quickstart.md). The creator
and audience use separate views; audiences do not need an account.

## Creator View

1. Open <http://localhost:5173> and sign up or log in.
2. In **YOUR EVENTS**, enter an event title and optional description, then
   select **CREATE EVENT**.
3. Select **ACTIVATE EVENT**. Copy the **PUBLIC PARTICIPATION LINK** and
   share it with the audience. A draft event does not accept questions.
4. Select **MODERATE QUESTIONS** to review submissions. Use **APPROVE** or
   **REJECT** for pending questions. Approved questions can later be marked
   **ANSWERED**.
5. In **POLL CONTROL**, create a poll with a question and 2–6 options. Select
   **ACTIVATE POLL** to accept votes, or **CLOSE POLL** to stop voting.
   Only one poll per event can be active at a time.
6. Select **END EVENT** when the event is over. Questions and voting stop;
   public results remain viewable.

Creators can manage only their own events. The creator who owns an event also
moderates it; there is no separate moderator account.

## Audience View

1. Open the public participation link. To test it locally without signing
   out, open it in a private/incognito window on the same computer.
2. While the event is active, enter a display name and question, then select
   **SUBMIT QUESTION**. No account is needed.
3. A submitted question is pending and private until the creator approves it.
   Approved and answered questions appear on the public page; connected pages
   update after moderation.
4. If a poll is active, choose one option and select **SUBMIT VOTE**. Results
   are shown while voting is open and remain visible after the poll closes.

The local public link uses `localhost`, so it works on the computer running
Docker, not as an internet-accessible link.
